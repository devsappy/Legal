"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { CornerDownLeft, MessageSquareText, Search, X } from "lucide-react";
import type { SessionUser } from "@sahayak/shared";
import { useRouter } from "@/i18n/navigation";
import { DialogBase } from "@/components/ui/Dialog";
import { Kbd } from "@/components/ui/Kbd";
import { usePersisted } from "@/hooks/usePersisted";
import { loadProcedures } from "@/lib/procedures-client";
import { askHref } from "@/lib/routes";
import { useCommandApi } from "./CommandProvider";
import { GROUP_ORDER, useCommands, type Command, type CommandGroup } from "./useCommands";

const RECENT_KEY = "coop.palette.recent";
const RECENT_MAX = 8;
const RECENT_SHOWN = 5;
/** How many rows a group shows before the user types. */
const IDLE_LIMIT: Partial<Record<CommandGroup, number>> = { conversations: 5, procedures: 5 };
const EMPTY: string[] = [];

type Row = { key: string; index: number } & ({ kind: "command"; command: Command } | { kind: "ask"; query: string });
type Section = { id: string; label: string; rows: Row[] };

/* ---- matching ------------------------------------------------------------ */

function norm(s: string) {
  return s.normalize("NFC").toLowerCase();
}

/** Higher is better; 0 means no match. Prefix > word start > substring > subsequence. */
function score(c: Command, q: string): number {
  const label = norm(c.label);
  if (label.startsWith(q)) return 100;
  if (label.includes(` ${q}`)) return 80;
  if (label.includes(q)) return 60;
  const extra = norm(`${c.hint ?? ""} ${c.keywords ?? ""}`);
  if (extra.includes(q)) return 40;
  if (q.length >= 2 && subsequence(label, q)) return 20;
  return 0;
}

function subsequence(text: string, q: string): boolean {
  let i = 0;
  for (const ch of text) {
    if (ch === q[i]) i += 1;
    if (i === q.length) return true;
  }
  return false;
}

/**
 * ⌘K palette: one search over actions, routes, conversations, procedures,
 * languages and Acts, with a fallback row that sends the typed sentence to
 * the assistant. A combobox drives a listbox (aria-activedescendant), so
 * focus never leaves the input while arrows move the highlight.
 */
export function CommandPalette({ user }: { user: SessionUser }) {
  const t = useTranslations("command");
  const ui = useTranslations("ui");
  const nav = useTranslations("nav");
  const router = useRouter();
  const { paletteOpen, closePalette } = useCommandApi();
  const commands = useCommands(user);
  const [recent, setRecent] = usePersisted<string[]>(RECENT_KEY, EMPTY);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const listId = `${id}-list`;
  const titleId = `${id}-title`;

  // A fresh open starts blank at the top; a new query resets the highlight.
  const [prevOpen, setPrevOpen] = useState(paletteOpen);
  if (paletteOpen !== prevOpen) {
    setPrevOpen(paletteOpen);
    setQuery("");
    setActive(0);
  }
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActive(0);
  }

  // Procedures are fetched once, the first time the palette opens.
  useEffect(() => {
    if (paletteOpen) void loadProcedures();
  }, [paletteOpen]);

  const q = norm(query.trim());

  const sections = useMemo<Section[]>(() => {
    const byGroup = new Map<CommandGroup, Command[]>();
    const push = (c: Command) => byGroup.set(c.group, [...(byGroup.get(c.group) ?? []), c]);

    if (!q) {
      for (const c of commands) push(c);
    } else {
      const scored = commands
        .map((c) => ({ c, s: score(c, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s);
      for (const { c } of scored) push(c);
    }

    const out: Section[] = [];
    if (!q && recent.length) {
      const byId = new Map(commands.map((c) => [c.id, c]));
      const rows = recent
        .map((rid) => byId.get(rid))
        .filter((c): c is Command => Boolean(c))
        .slice(0, RECENT_SHOWN)
        .map((c) => ({ key: `recent:${c.id}`, index: 0, kind: "command" as const, command: c }));
      if (rows.length) out.push({ id: "recent", label: t("recent"), rows });
    }
    for (const g of GROUP_ORDER) {
      const items = byGroup.get(g);
      if (!items?.length) continue;
      const limit = q ? items.length : (IDLE_LIMIT[g] ?? items.length);
      out.push({
        id: g,
        label: t(`groups.${g}`),
        rows: items.slice(0, limit).map((c) => ({ key: c.id, index: 0, kind: "command" as const, command: c })),
      });
    }
    if (q.length >= 2) {
      out.push({ id: "ask", label: nav("chat"), rows: [{ key: "ask", index: 0, kind: "ask", query: query.trim() }] });
    }
    // Flat position of every row, for aria-activedescendant and the arrow keys.
    let i = 0;
    for (const section of out) for (const row of section.rows) row.index = i++;
    return out;
  }, [commands, q, query, recent, t, nav]);

  const rows = useMemo(() => sections.flatMap((s) => s.rows), [sections]);
  const activeIndex = Math.min(active, Math.max(0, rows.length - 1));
  const activeId = rows.length ? `${id}-opt-${activeIndex}` : undefined;

  // Keep the highlighted row in view; a DOM write, not state.
  useEffect(() => {
    if (!paletteOpen) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, paletteOpen]);

  const remember = (cid: string) => {
    setRecent((prev) => [cid, ...prev.filter((x) => x !== cid)].slice(0, RECENT_MAX));
  };

  const run = (row: Row | undefined) => {
    if (!row) return;
    closePalette();
    if (row.kind === "ask") {
      router.push(askHref({ q: row.query }));
      return;
    }
    remember(row.command.id);
    row.command.run();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!rows.length && e.key !== "Escape") return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((activeIndex + 1) % rows.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((activeIndex - 1 + rows.length) % rows.length);
        break;
      case "Home":
        if (query) return;
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        if (query) return;
        e.preventDefault();
        setActive(rows.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        run(rows[activeIndex]);
        break;
    }
  };

  return (
    <DialogBase
      open={paletteOpen}
      onOpenChange={(o) => {
        if (!o) closePalette();
      }}
      labelledBy={titleId}
      initialFocusRef={inputRef}
      className={clsx(
        "w-full max-h-[calc(100dvh-2rem)] rounded-lg sm:mt-[15vh] sm:mb-auto sm:w-[calc(100vw-2rem)] sm:max-w-[640px]",
        // Phones: the palette is the whole screen.
        "max-sm:m-0 max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none max-sm:border-0",
      )}
    >
      <h2 id={titleId} className="sr-only">
        {t("label")}
      </h2>
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-rule px-3">
        <Search size={16} strokeWidth={2} className="shrink-0 text-ink-3" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label={t("label")}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t("placeholder")}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-3 outline-none sm:text-sm"
        />
        <Kbd combo="escape" className="max-sm:hidden" />
        <button
          type="button"
          aria-label={ui("close")}
          onClick={closePalette}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-2 hover:bg-muted hover:text-ink sm:hidden"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={t("label")}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:max-h-[min(60vh,440px)]"
      >
        {rows.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-ink-2">{t("noResults")}</p>
        ) : (
          sections.map((section) => {
            const headingId = `${id}-g-${section.id}`;
            return (
              <div key={section.id} role="group" aria-labelledby={headingId} className="mb-1 last:mb-0">
                <div id={headingId} role="presentation" className="px-2 pb-1 pt-2 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
                  {section.label}
                </div>
                {section.rows.map((row) => {
                  const i = row.index;
                  const selected = i === activeIndex;
                  const Icon = row.kind === "command" ? row.command.icon : MessageSquareText;
                  return (
                    <button
                      key={row.key}
                      type="button"
                      role="option"
                      id={`${id}-opt-${i}`}
                      data-index={i}
                      aria-selected={selected}
                      tabIndex={-1}
                      onMouseMove={() => {
                        if (!selected) setActive(i);
                      }}
                      onClick={() => run(row)}
                      className={clsx(
                        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors",
                        selected ? "bg-muted text-ink" : "text-ink-2",
                      )}
                    >
                      <span aria-hidden className="flex w-4 shrink-0 justify-center text-ink-2">
                        {Icon && <Icon size={15} strokeWidth={1.75} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-ink">
                          {row.kind === "ask" ? t("askThis", { query: row.query }) : row.command.label}
                        </span>
                        {row.kind === "command" && row.command.hint && (
                          <span className="block truncate text-xs text-ink-3">{row.command.hint}</span>
                        )}
                      </span>
                      {row.kind === "command" && row.command.shortcut && (
                        <Kbd combo={row.command.shortcut} className="ml-2 shrink-0" />
                      )}
                      {selected && <CornerDownLeft size={13} className="ml-1 shrink-0 text-ink-3" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <footer className="hidden shrink-0 items-center gap-4 border-t border-rule px-3 py-2 text-2xs text-ink-3 sm:flex">
        <span className="flex items-center gap-1">
          <Kbd combo="arrowup" />
          <Kbd combo="arrowdown" />
          {t("legend.navigate")}
        </span>
        <span className="flex items-center gap-1">
          <Kbd combo="enter" />
          {t("legend.open")}
        </span>
        <span className="flex items-center gap-1">
          <Kbd combo="escape" />
          {t("legend.close")}
        </span>
      </footer>
    </DialogBase>
  );
}

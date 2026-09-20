"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ListChecks,
  LogOut,
  MessageSquareText,
  PanelLeftClose,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import clsx from "clsx";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useChatContext } from "@/components/chat/ChatProvider";
import { bucketOf, clearHistory, useHistory, type HistoryBucket } from "@/lib/history";
import { LatticeLoader } from "@/components/reactbits";
import { BrandMark } from "@/components/ui/BrandMark";
import type { SessionUser } from "@sahayak/shared";

const NAV = [
  { href: "/ask", key: "chat", icon: MessageSquareText },
  { href: "/checklists", key: "checklists", icon: ListChecks, match: "/checklists" },
  { href: "/admin/documents", key: "admin", icon: Settings2, match: "/admin" },
] as const;

const BUCKETS: HistoryBucket[] = ["today", "yesterday", "week", "older"];

type Props = {
  user: SessionUser;
  onCollapse: () => void;
  /** Called after a nav or history pick, so a drawer can close. */
  onNavigate?: () => void;
  /** Bind Ctrl/Cmd+K to the search field. Only one instance should. */
  hotkey?: boolean;
};

export function Sidebar({ user, onCollapse, onNavigate, hotkey }: Props) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const chat = useChatContext();
  const history = useHistory();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  const isActive = (item: (typeof NAV)[number]) =>
    "match" in item ? pathname.startsWith(item.match) : pathname === item.href;

  const goToAsk = () => {
    if (pathname !== "/ask") router.push("/ask");
    onNavigate?.();
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    chat.reset();
    clearHistory();
    router.replace("/login");
    router.refresh();
  };

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? history.filter((c) => c.title.toLowerCase().includes(q)) : history;
    const groups = new Map<HistoryBucket, typeof list>();
    for (const c of list) {
      const b = bucketOf(c.updatedAt);
      groups.set(b, [...(groups.get(b) ?? []), c]);
    }
    return groups;
  }, [history, query]);

  return (
    <div className="flex flex-col h-full min-h-0 px-3 pt-3 pb-3 gap-3">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-1 h-8">
        <BrandMark />
        <span className="font-semibold tracking-tight text-[15px] text-ink truncate">{t("app.name")}</span>
        <button
          type="button"
          onClick={onCollapse}
          aria-label={t("shell.collapse")}
          className="ml-auto h-7 w-7 inline-flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-muted"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* New conversation */}
      <button
        type="button"
        onClick={() => {
          chat.reset();
          goToAsk();
        }}
        className="h-9 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink text-paper text-[13.5px] font-medium hover:opacity-90 transition-opacity"
      >
        <Plus size={15} strokeWidth={2.25} aria-hidden />
        {t("chat.newChat")}
      </button>

      {/* Search */}
      <label className="relative block">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("shell.search")}
          aria-label={t("shell.search")}
          className="h-8 w-full rounded-lg border border-rule bg-sheet pl-8 pr-10 text-[13px] text-ink placeholder:text-ink-3 outline-none focus:border-brand/60"
        />
        {hotkey && (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-3 border border-rule rounded px-1 py-px bg-muted">
            ⌘K
          </kbd>
        )}
      </label>

      {/* Primary nav */}
      <nav aria-label="Primary">
        <ul className="space-y-0.5">
          {NAV.filter((item) => item.key !== "admin" || user.role === "admin").map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-2.5 h-8 px-2 rounded-lg text-[13.5px] transition-colors",
                    active
                      ? "bg-sheet text-ink font-medium shadow-[0_1px_0_var(--rule)]"
                      : "text-ink-2 hover:text-ink hover:bg-sheet/70",
                  )}
                >
                  <Icon size={16} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* History */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-thin -mx-1 px-1">
        {history.length === 0 ? (
          <p className="px-2 pt-2 text-[12px] text-ink-3 leading-relaxed">{t("shell.noHistory")}</p>
        ) : grouped.size === 0 ? (
          <p className="px-2 pt-2 text-[12px] text-ink-3">{t("shell.noMatches")}</p>
        ) : (
          BUCKETS.filter((b) => grouped.has(b)).map((b) => (
            <section key={b} className="mb-3">
              <h2 className="px-2 mb-1 text-[11px] text-ink-3">{t(`shell.${b}`)}</h2>
              <ul className="space-y-px">
                {grouped.get(b)!.map((c) => {
                  const active = c.id === chat.sessionId && pathname === "/ask";
                  const working = active && chat.busy;
                  return (
                    <li key={c.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => {
                          chat.open(c.id);
                          goToAsk();
                        }}
                        aria-current={active ? "true" : undefined}
                        className={clsx(
                          "w-full text-left h-8 pl-2 pr-7 rounded-lg text-[13px] truncate transition-colors",
                          active
                            ? "bg-sheet text-ink shadow-[0_1px_0_var(--rule)]"
                            : "text-ink-2 hover:text-ink hover:bg-sheet/70",
                        )}
                      >
                        {c.title}
                      </button>
                      {working ? (
                        // The composer's loader does the announcing; this one is purely visual.
                        <span aria-hidden className="absolute right-2 top-1/2 -translate-y-1/2 flex">
                          <LatticeLoader
                            status="working"
                            label=""
                            pattern="snake"
                            grid={3}
                            shape="round"
                            cellSize={3}
                            gap={2}
                            fontSize={10}
                            color="var(--brand)"
                            showTimer={false}
                          />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => chat.remove(c.id)}
                          aria-label={t("shell.delete")}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded text-ink-3 hover:text-seal hover:bg-seal-soft opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      {/* Signed-in user */}
      <div className="flex items-center gap-2.5 rounded-xl border border-rule bg-sheet p-2 pr-1.5">
        <span className="h-9 w-9 shrink-0 rounded-full bg-brand-soft text-brand flex items-center justify-center text-[13px] font-semibold">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[13px] font-medium text-ink truncate">{user.name}</span>
          <span className="block text-[11px] text-ink-3 truncate">{user.email}</span>
        </span>
        <button
          type="button"
          onClick={signOut}
          aria-label={t("shell.signOut")}
          title={t("shell.signOut")}
          className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-muted"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Check, ChevronDown, CircleAlert } from "lucide-react";
import clsx from "clsx";
import type { Citation } from "@/lib/types";

type Props = {
  citations: Citation[];
  open: boolean;
  onToggle: () => void;
  active: number | null;
  onSelect: (id: number | null) => void;
};

/**
 * Sections the answer relies on, folded under the answer.
 * A [n] chip in the text opens this and highlights its entry.
 * Verified entries are the only green in the transcript; unverified ones
 * are marked in seal so a reader checks the Act before relying on them.
 */
export function InlineSources({ citations, open, onToggle, active, onSelect }: Props) {
  const t = useTranslations("chat");
  const id = useId();
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!open || active == null || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-cite="${active}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open, active]);

  if (citations.length === 0) return null;
  const verified = citations.filter((c) => c.verified).length;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-rule bg-sheet" data-print="expand">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-ink-2 transition-colors hover:bg-muted"
        data-print="hide"
      >
        <BookOpen size={14} className="shrink-0 text-ink" aria-hidden />
        <span className="font-medium text-ink">{t("openSources", { count: citations.length })}</span>
        <span className="hidden text-ink-3 sm:inline">
          · {verified}/{citations.length} {t("verifiedShort")}
        </span>
        <ChevronDown
          size={15}
          className={clsx(
            "ml-auto shrink-0 text-ink-3 transition-transform duration-(--dur-2) ease-standard motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <ol
        ref={listRef}
        id={id}
        hidden={!open}
        className="divide-y divide-rule border-t border-rule"
        data-print="expand"
        aria-label={t("sources")}
      >
        {citations.map((c) => {
          const isActive = active === c.id;
          return (
            <li key={c.id} data-cite={c.id}>
              <button
                type="button"
                onClick={() => onSelect(isActive ? null : c.id)}
                aria-pressed={isActive}
                className={clsx("w-full px-3 py-2.5 text-left transition-colors", isActive ? "bg-muted" : "hover:bg-muted/60")}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={clsx(
                      "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-2xs font-semibold",
                      isActive ? "border-ink bg-ink text-paper" : "border-rule-strong bg-sheet text-ink",
                    )}
                  >
                    {c.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-sm text-ink">{c.section}</span>
                      <span className="text-sm text-ink">{c.title}</span>
                    </div>
                    <div className="truncate text-xs text-ink-3">{c.act}</div>
                    {isActive && (
                      <blockquote className="mt-1.5 border-l-2 border-rule-strong pl-2.5 text-sm italic text-ink-2">
                        &ldquo;{c.excerpt}&rdquo;
                      </blockquote>
                    )}
                  </div>
                  <span
                    className={clsx(
                      "mt-0.5 inline-flex shrink-0 items-center gap-1 text-2xs",
                      c.verified ? "text-verified" : "text-seal",
                    )}
                    title={c.verified ? t("verified") : t("unverified")}
                  >
                    {c.verified ? (
                      <Check size={13} strokeWidth={2.5} aria-hidden />
                    ) : (
                      <CircleAlert size={13} aria-hidden />
                    )}
                    <span className="sr-only">{c.verified ? t("verified") : t("unverified")}</span>
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
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
 */
export function InlineSources({ citations, open, onToggle, active, onSelect }: Props) {
  const t = useTranslations("chat");
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!open || active == null || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-cite="${active}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open, active]);

  if (citations.length === 0) return null;
  const verified = citations.filter((c) => c.verified).length;

  return (
    <div className="mt-3 rounded-lg border border-rule bg-sheet overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 h-10 text-left text-[13px] text-ink-2 hover:bg-muted transition-colors"
      >
        <BookOpen size={14} className="text-brand shrink-0" aria-hidden />
        <span className="font-medium text-ink">{t("openSources", { count: citations.length })}</span>
        <span className="hidden sm:inline text-ink-3">
          · {verified}/{citations.length} {t("verifiedShort")}
        </span>
        <ChevronDown
          size={15}
          className={clsx("ml-auto shrink-0 text-ink-3 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <ol ref={listRef} className="border-t border-rule divide-y divide-rule">
          {citations.map((c) => {
            const isActive = active === c.id;
            return (
              <li key={c.id} data-cite={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(isActive ? null : c.id)}
                  aria-pressed={isActive}
                  className={clsx(
                    "w-full text-left px-3 py-2.5 transition-colors",
                    isActive ? "bg-brand-soft/60" : "hover:bg-muted/70",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={clsx(
                        "mt-0.5 font-mono text-[11px] font-semibold w-5 h-5 shrink-0 inline-flex items-center justify-center rounded border",
                        isActive
                          ? "bg-brand border-brand text-primary-foreground"
                          : "border-brand/50 text-ink bg-brand-soft",
                      )}
                    >
                      {c.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono text-[13px] text-ink">{c.section}</span>
                        <span className="text-[13px] text-ink">{c.title}</span>
                      </div>
                      <div className="text-[12.5px] text-ink-3 truncate">{c.act}</div>
                      {isActive && (
                        <blockquote className="mt-1.5 text-[13px] text-ink-2 italic border-l-2 border-brand/40 pl-2.5">
                          &ldquo;{c.excerpt}&rdquo;
                        </blockquote>
                      )}
                    </div>
                    <span
                      className={clsx(
                        "mt-0.5 shrink-0 inline-flex items-center gap-1 text-[11.5px]",
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
      )}
    </div>
  );
}

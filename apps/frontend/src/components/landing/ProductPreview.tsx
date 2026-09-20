"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { ArrowUp, Check, CircleAlert, Mic } from "lucide-react";
import { JURISDICTIONS, LANGUAGES } from "@sahayak/shared";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefs } from "@/lib/prefs";
import { BrandMark } from "@/components/ui/BrandMark";
import { PREVIEW_CITATIONS, PREVIEW_TIMING as T, countTokens, previewAnswer, type PreviewToken } from "./PreviewData";

type Progress = { chars: number; units: number };

const NONE: Progress = { chars: 0, units: 0 };
const KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** "MCS Act 1960" -> "MCS": the segmented control has room for the code only. */
const code = (short: string) => short.split(" ")[0];

/** Punctuation that closes up against a citation chip instead of taking a space. */
const CLOSES = /^[.,;:!?)\]»”]/;

function paragraphNodes(tokens: PreviewToken[], count: number): ReactNode[] {
  const nodes: ReactNode[] = [];
  const upto = Math.min(count, tokens.length);
  for (let i = 0; i < upto; i++) {
    const tk = tokens[i];
    if (tk.kind === "cite") {
      nodes.push(
        <span key={i} className="cite cursor-default" aria-label={`[${tk.n}]`}>
          {tk.n}
        </span>,
      );
      continue;
    }
    const prev = tokens[i - 1];
    const glued = i === 0 || (prev?.kind === "cite" && CLOSES.test(tk.text));
    nodes.push(glued ? tk.text : ` ${tk.text}`);
  }
  return nodes;
}

/**
 * The hero's framed app window: a jurisdiction control bound to the real
 * store (so the choice carries into the app), the four languages with the
 * current one lit, and a sample exchange that types itself and streams the
 * canned answer word by word the first time 40% of it is on screen. One
 * requestAnimationFrame loop drives the whole timeline from elapsed time;
 * under reduced motion (OS or Settings) everything renders complete at once.
 */
export function ProductPreview() {
  const t = useTranslations("landing.preview");
  const locale = useLocale();
  const id = useId();
  const { jurisdiction, setJurisdiction } = useJurisdiction();
  const osReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const prefs = usePrefs();
  const reduced = osReduced || prefs.reduceMotion;

  const question = t("sample");
  const paragraphs = useMemo(() => previewAnswer(locale), [locale]);
  const total = countTokens(paragraphs);
  // Where each paragraph starts in the unit count, so a paragraph can tell
  // how many of its own tokens are on screen.
  const starts = useMemo(
    () => paragraphs.map((_, i) => paragraphs.slice(0, i).reduce((n, p) => n + p.length, 0)),
    [paragraphs],
  );
  const current = JURISDICTIONS.find((j) => j.id === jurisdiction) ?? JURISDICTIONS[0];

  const [progress, setProgress] = useState<Progress>(NONE);
  const root = useRef<HTMLElement>(null);
  const played = useRef(false);

  // Runs once: starts the timeline when the frame is 40% visible. Elapsed
  // time decides how many characters and words are shown, so a dropped
  // frame never desynchronises the two, and state only changes when a
  // count changes.
  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || played.current) return;
        played.current = true;
        io.disconnect();
        const start = performance.now();
        const typing = question.length * T.char;
        let last = NONE;
        const tick = (now: number) => {
          const elapsed = now - start - T.lead;
          const chars = clamp(Math.floor(elapsed / T.char), 0, question.length);
          const units = clamp(Math.floor((elapsed - typing - T.think) / T.word), 0, total);
          if (chars !== last.chars || units !== last.units) {
            last = { chars, units };
            setProgress(last);
          }
          if (units < total) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [reduced, question, total]);

  const shown: Progress = reduced ? { chars: question.length, units: total } : progress;
  const typing = shown.chars < question.length || shown.units === 0;
  const streaming = shown.units > 0 && shown.units < total;
  const done = shown.units >= total;

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!KEYS.has(e.key)) return;
    const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]"));
    const from = Math.max(
      0,
      tabs.findIndex((b) => b === document.activeElement),
    );
    let next = from;
    if (e.key === "ArrowLeft") next = (from - 1 + tabs.length) % tabs.length;
    if (e.key === "ArrowRight") next = (from + 1) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    e.preventDefault();
    tabs[next]?.focus();
    const value = tabs[next]?.dataset.tab;
    if (value) setJurisdiction(value);
  };

  return (
    <figure
      ref={root}
      aria-label={t("windowTitle")}
      data-motion
      className="relative overflow-hidden rounded-xl border border-rule-strong bg-sheet text-ink shadow-raised max-sm:max-h-[420px] max-sm:mask-b-from-70%"
    >
      {/* Title bar */}
      <div className="relative flex h-9 items-center border-b border-rule px-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full border border-rule-strong" />
          <span className="size-2.5 rounded-full border border-rule-strong" />
          <span className="size-2.5 rounded-full border border-rule-strong" />
        </span>
        <span className="absolute left-1/2 -translate-x-1/2 font-mono text-2xs text-ink-3" aria-hidden>
          {t("path")}
        </span>
      </div>

      {/* Context row: which Act, which language */}
      <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div
          role="tablist"
          aria-label={t("jurisdiction")}
          onKeyDown={onTabKey}
          className="scroll-thin -mx-1 flex gap-0.5 overflow-x-auto px-1"
        >
          {JURISDICTIONS.map((j) => {
            const active = j.id === current.id;
            return (
              <button
                key={j.id}
                type="button"
                role="tab"
                id={`${id}-tab-${j.id}`}
                aria-selected={active}
                aria-controls={`${id}-panel`}
                aria-label={j.short}
                title={j.act}
                tabIndex={active ? 0 : -1}
                data-tab={j.id}
                onClick={() => setJurisdiction(j.id)}
                style={{ outlineOffset: -2 }}
                className={clsx(
                  "h-7 shrink-0 rounded-md px-2 font-mono text-2xs font-medium transition-colors",
                  active ? "bg-ink text-paper" : "text-ink-2 hover:bg-muted hover:text-ink",
                )}
              >
                {code(j.short)}
              </button>
            );
          })}
        </div>
        <ul aria-label={t("languages")} className="flex flex-wrap gap-1">
          {LANGUAGES.map((l) => {
            const active = l.code === locale;
            return (
              <li
                key={l.code}
                lang={l.code}
                aria-current={active ? "true" : undefined}
                className={clsx(
                  "inline-flex h-6 items-center rounded-full px-2 text-2xs font-medium",
                  active ? "bg-ink text-paper" : "border border-rule text-ink-2",
                )}
              >
                {l.native}
              </li>
            );
          })}
        </ul>
      </div>

      <p className="border-y border-rule bg-muted/50 px-3 py-1.5 font-mono text-2xs text-ink-2 sm:px-4">
        {t("answeringFrom", { act: current.act })}
      </p>

      {/* The exchange */}
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${current.id}`} className="flex flex-col gap-4 p-3 sm:p-4">
        {/* Composer mock: the question types itself */}
        <div className="flex items-center gap-2 rounded-lg border border-rule bg-paper px-3 py-2">
          <span className="sr-only">{t("you")}</span>
          <span className={clsx("min-h-6 min-w-0 flex-1 text-sm text-ink", typing && !reduced && "caret")}>
            {question.slice(0, shown.chars)}
          </span>
          <span className="shrink-0 text-ink-3" aria-hidden>
            <Mic size={15} strokeWidth={1.75} />
          </span>
          <span
            className={clsx(
              "inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
              shown.chars === question.length ? "bg-ink text-paper" : "bg-muted text-ink-3",
            )}
            aria-hidden
          >
            <ArrowUp size={14} strokeWidth={2} />
          </span>
        </div>

        {/* Assistant */}
        <div className={clsx("flex gap-3 transition-opacity duration-(--dur-3)", shown.units === 0 && !reduced ? "opacity-0" : "opacity-100")}>
          <BrandMark size={24} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="sr-only">{t("assistant")}</p>
            <div className="text-sm leading-relaxed text-ink" lang={locale}>
              {paragraphs.map((tokens, pi) => {
                const count = shown.units - starts[pi];
                if (count <= 0) return null;
                const isLast = streaming && count < tokens.length;
                return (
                  <p key={pi} className={clsx("mt-2 first:mt-0", isLast && "caret")}>
                    {paragraphNodes(tokens, count)}
                  </p>
                );
              })}
            </div>

            {done && (
              <div className="rise mt-4 border-t border-rule pt-3" data-motion>
                <p className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{t("sources")}</p>
                <ol className="mt-2 flex flex-col gap-1.5">
                  {PREVIEW_CITATIONS.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 text-xs">
                      <span className="cite cursor-default shrink-0">{c.id}</span>
                      {c.verified ? (
                        <Check size={14} strokeWidth={2.25} className="shrink-0 text-verified" aria-hidden />
                      ) : (
                        <CircleAlert size={14} strokeWidth={2} className="shrink-0 text-seal" aria-hidden />
                      )}
                      <span className="shrink-0 font-mono text-ink">{c.section}</span>
                      <span className="min-w-0 truncate text-ink-2">{c.title}</span>
                      <span className={clsx("ml-auto shrink-0 whitespace-nowrap text-2xs", c.verified ? "text-verified" : "text-seal")}>
                        {c.verified ? t("verified") : t("unverified")}
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="stamp">{t("stamp")}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}

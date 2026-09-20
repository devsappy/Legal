"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { askHref, loginHref } from "@/lib/routes";

export type Persona = { name: string; questions: string[] };
export type Topic = { name: string; example: string };

type Props = {
  personas: Persona[];
  topics: Topic[];
};

const KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);
const BOX = "grid gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong";
const CELL = "p-5 sm:p-6";

/**
 * Five role chips (a tablist with roving focus and automatic activation)
 * over a hairline grid of three question tiles for the chosen role plus a
 * tile of the six topics. Every question tile is a link into the
 * assistant, wrapped in sign-in (?next= carries the question through), and
 * inverts to ink on hover and keyboard focus like the landing's other links.
 */
export function PersonaSwitcher({ personas, topics }: Props) {
  const t = useTranslations("landing");
  const id = useId();
  const [active, setActive] = useState(0);
  const persona = personas[active] ?? personas[0];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
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
    setActive(next);
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p id={`${id}-label`} className="shrink-0 text-sm font-medium text-ink-2">
          {t("personas.label")}
        </p>
        <div
          role="tablist"
          aria-labelledby={`${id}-label`}
          onKeyDown={onKeyDown}
          className="scroll-thin -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {personas.map((p, i) => {
            const selected = i === active;
            return (
              <button
                key={p.name}
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-selected={selected}
                aria-controls={`${id}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={clsx(
                  "h-8 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-ink bg-ink text-paper"
                    : "border-rule bg-sheet text-ink-2 hover:border-rule-strong hover:text-ink",
                )}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <ul
        key={active}
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        data-motion
        className={clsx(
          BOX,
          "mt-4 sm:grid-cols-2 lg:grid-cols-4 animate-[rise_200ms_cubic-bezier(0.2,0.7,0.2,1)_both] motion-reduce:animate-none [html[data-motion=reduced]_&]:animate-none",
        )}
      >
        {persona.questions.map((q, i) => (
          <li key={q} className="flex bg-sheet">
            <Link
              href={loginHref(askHref({ q }))}
              className={clsx("cell-link group flex w-full flex-col bg-sheet", CELL)}
              style={{ outlineOffset: -2 }}
            >
              <span className="flex items-center justify-between font-mono text-2xs text-ink-3">
                <span>
                  {String(i + 1).padStart(2, "0")} · {persona.name}
                </span>
                <MessageSquareText size={14} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="mt-4 flex-1 text-base font-medium leading-snug tracking-tight text-ink">“{q}”</span>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-ink-2">
                {t("personas.askThis")}
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
        <li className={clsx("tile tile--tint flex flex-col", CELL)}>
          <h3 className="text-sm font-semibold tracking-tight text-ink">{t("topics.title")}</h3>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {topics.map((tp) => (
              <li key={tp.name} className="inline-flex h-6 items-center rounded-md border border-rule bg-sheet px-2 font-mono text-2xs text-ink-2" title={tp.example}>
                {tp.name}
              </li>
            ))}
          </ul>
          <p className="mt-auto pt-4 text-xs text-ink-3">{t("personas.body")}</p>
        </li>
      </ul>
    </div>
  );
}

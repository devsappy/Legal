"use client";

import { useTranslations } from "next-intl";
import { Check, FileSearch, Languages, PenLine, ShieldCheck, X } from "lucide-react";

const STEPS = [
  { key: "understand", icon: Languages },
  { key: "search", icon: FileSearch },
  { key: "verify", icon: ShieldCheck },
  { key: "draft", icon: PenLine },
] as const;

/**
 * The four steps every answer goes through (the same vocabulary as the
 * trace above each reply) followed by the landing page's "does / doesn't"
 * lists, so the promise made on the marketing site is repeated in-app.
 */
export function GuideTab() {
  const t = useTranslations("help.guide");
  const trust = useTranslations("landing.trust");
  const does = trust.raw("does") as string[];
  const doesNot = trust.raw("doesNot") as string[];

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-2">{t("intro")}</p>

      <ol className="grid gap-px overflow-hidden rounded-lg border border-rule-strong bg-rule-strong">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.key} className="tile flex gap-3 p-4">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-rule bg-sheet text-ink"
              >
                <Icon size={15} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="flex items-baseline gap-2 text-sm font-medium text-ink">
                  <span className="font-mono text-2xs text-ink-3">0{i + 1}</span>
                  {t(`${step.key}.title`)}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{t(`${step.key}.body`)}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="help-trust-title">
        <h3 id="help-trust-title" className="mb-3 text-sm font-medium text-ink">
          {trust("title")}
        </h3>
        <div className="grid gap-px overflow-hidden rounded-lg border border-rule-strong bg-rule-strong sm:grid-cols-2">
          <TrustList title={trust("doesTitle")} items={does} kind="does" />
          <TrustList title={trust("doesNotTitle")} items={doesNot} kind="doesNot" />
        </div>
      </section>
    </div>
  );
}

function TrustList({ title, items, kind }: { title: string; items: string[]; kind: "does" | "doesNot" }) {
  const Icon = kind === "does" ? Check : X;
  return (
    <div className="bg-sheet p-4">
      <p className="mb-2 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-ink-2">
            <span
              aria-hidden
              className={
                kind === "does"
                  ? "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] bg-ink text-paper"
                  : "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-rule-strong text-ink-3"
              }
            >
              <Icon size={10} strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

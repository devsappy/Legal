"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, CalendarClock, FilePlus2, ShieldAlert, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FirstRunStrip } from "./FirstRunStrip";

type Example = { topic: string; question: string };

// One glyph per example, in the order the messages list them.
const ICONS = [FilePlus2, Users, CalendarClock, ShieldAlert];

type Props = {
  onPick: (q: string) => void;
  /** The composer (with its context line), rendered in the hero rather than docked at the bottom. */
  composer: ReactNode;
};

export function EmptyState({ onPick, composer }: Props) {
  const t = useTranslations();
  const examples = t.raw("chat.examples") as Example[];

  return (
    <div className="rise mx-auto flex w-full max-w-[760px] flex-1 flex-col px-4 py-6 sm:py-8" data-motion>
      {/* my-auto centres the hero on tall screens and degrades to a normal scroll on short ones */}
      <div className="my-auto flex w-full flex-col items-center">
        <div className="orb mb-7 sm:mb-8" aria-hidden />

        <p className="greeting px-2 text-[22px] font-medium leading-snug tracking-tight sm:text-[26px]">{t("chat.greeting")}</p>
        <h1 className="mb-7 mt-2 text-center text-[clamp(26px,4.5vw,34px)] text-ink sm:mb-8">{t("chat.emptyTitle")}</h1>

        <div className="w-full">{composer}</div>

        <FirstRunStrip />

        <ul className="mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("chat.examplesLabel")}>
          {examples.map((ex, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={ex.question}>
                <button
                  type="button"
                  onClick={() => onPick(ex.question)}
                  className="group flex h-full w-full flex-col items-start rounded-xl border border-rule bg-sheet p-4 text-left transition-[border-color,box-shadow,background-color] duration-(--dur-2) hover:border-rule-strong hover:bg-muted/40 hover:shadow-raised active:translate-y-px"
                >
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-2 transition-colors duration-(--dur-2) group-hover:bg-ink group-hover:text-paper">
                    <Icon size={16} strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="mb-1 block text-sm font-medium text-ink">{ex.topic}</span>
                  <span className="block text-xs leading-snug text-ink-3">{ex.question}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <Link
          href="/checklists"
          className="mt-6 inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-ink-2 transition-colors hover:bg-muted hover:text-ink"
        >
          {t("chat.browseProcedures")}
          <ArrowUpRight size={12} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

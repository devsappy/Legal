"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowUpRight,
  CalendarClock,
  FilePlus2,
  Scale,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { JURISDICTIONS } from "@/lib/config";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";

type Example = { topic: string; question: string };

// One glyph per example, in the order the messages list them.
const ICONS = [FilePlus2, Users, CalendarClock, ShieldAlert];

type Props = {
  onPick: (q: string) => void;
  /** The composer, rendered in the hero rather than docked at the bottom. */
  composer: ReactNode;
};

export function EmptyState({ onPick, composer }: Props) {
  const t = useTranslations();
  const { jurisdiction } = useJurisdiction();
  const examples = t.raw("chat.examples") as Example[];
  const j = JURISDICTIONS.find((x) => x.id === jurisdiction);

  return (
    <div className="rise flex-1 flex flex-col w-full max-w-[760px] mx-auto px-4 py-6 sm:py-8">
      {/* my-auto centres the hero on tall screens and degrades to a normal scroll on short ones */}
      <div className="my-auto flex flex-col items-center w-full">
        <div className="orb mb-7 sm:mb-8" aria-hidden />

        <p className="greeting px-2 text-[22px] sm:text-[26px] font-medium tracking-tight leading-snug">
          {t("chat.greeting")}
        </p>
        <h1 className="text-[clamp(26px,4.5vw,34px)] text-ink text-center mt-2 mb-7 sm:mb-8">
          {t("chat.emptyTitle")}
        </h1>

        <div className="w-full">
          {composer}
          {/* Attached strip: which Act the answer will come from. */}
          <div className="mx-2 -mt-2 pt-4 pb-1.5 px-3 rounded-b-xl border border-t-0 border-rule bg-muted/60 flex items-center gap-2 text-[12.5px] text-ink-2 min-h-11">
            <Scale size={13} className="text-violet shrink-0" aria-hidden />
            <span className="truncate">
              {t("chat.answeringFrom")}{" "}
              <span className="text-ink font-medium sm:hidden">{j?.short}</span>
              <span className="text-ink font-medium hidden sm:inline">
                {j?.act}
              </span>
            </span>
            <Link
              href="/checklists"
              className="ml-auto shrink-0 inline-flex items-center gap-1 h-7 px-2 rounded-md border border-rule bg-sheet text-[12px] font-medium text-ink hover:border-violet/50 transition-colors"
            >
              {t("nav.checklists")}
              <ArrowUpRight size={12} aria-hidden />
            </Link>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 w-full mt-8">
          {examples.map((ex, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={ex.question}>
                <button
                  type="button"
                  onClick={() => onPick(ex.question)}
                  className="group w-full h-full flex flex-col items-start text-left rounded-xl border border-rule bg-sheet p-4 hover:border-violet/50 hover:shadow-[0_10px_30px_-18px_color-mix(in_srgb,var(--violet)_55%,transparent)] transition-[border-color,box-shadow]"
                >
                  <span className="h-8 w-8 rounded-lg bg-muted text-ink-2 group-hover:bg-violet-soft group-hover:text-violet flex items-center justify-center mb-3 transition-colors">
                    <Icon size={16} strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="block text-[13.5px] font-medium text-ink mb-1">
                    {ex.topic}
                  </span>
                  <span className="block text-[12.5px] text-ink-3 leading-snug">
                    {ex.question}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

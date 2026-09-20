"use client";

import { useLocale, useTranslations } from "next-intl";
import { BookOpenCheck, Languages, ListChecks, Scale } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { CountUp } from "@/components/landing/CountUp";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Stat } from "@/components/ui/Stat";

/** Numbers from /api/stats; null when the backend did not answer. */
export type CorpusStats = { sections: number; procedures: number; acts: number } | null;

/**
 * The corpus at a glance, in the landing page's counting tiles. Renders
 * its own hairline sub-grid, so the page places it in an unpadded cell
 * and the lines run flush with the outer grid. Nothing is invented when
 * the backend is down: the cell says so and offers a retry.
 */
export function StatsStrip({ stats }: { stats: CorpusStats }) {
  const t = useTranslations("home");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const router = useRouter();
  // Latin digits in every language, like the rest of the app's numbers.
  const digits = `${locale}-u-nu-latn`;

  if (stats === null) {
    return (
      <div className="tile flex h-full flex-col p-5 sm:p-6">
        <h2 className="text-base font-medium text-ink">{t("corpusTitle")}</h2>
        <EmptyState
          compact
          tone="error"
          title={t("loadFailed")}
          action={
            <Button size="sm" onClick={() => router.refresh()}>
              {tUi("retry")}
            </Button>
          }
        />
      </div>
    );
  }

  const items = [
    { key: "sections", value: stats.sections, icon: BookOpenCheck, href: undefined },
    { key: "acts", value: stats.acts || JURISDICTIONS.length, icon: Scale, href: undefined },
    { key: "procedures", value: stats.procedures, icon: ListChecks, href: "/checklists" },
    { key: "languages", value: LANGUAGES.length, icon: Languages, href: undefined },
  ] as const;

  return (
    <section aria-label={t("corpusTitle")} className="grid h-full grid-cols-2 gap-px bg-rule-strong sm:grid-cols-4">
      {items.map(({ key, value, icon: Icon, href }) => (
        <Stat
          key={key}
          label={t(`stats.${key}`)}
          value={<CountUp value={value} locale={digits} />}
          icon={<Icon size={15} strokeWidth={1.75} />}
          href={href}
          className="h-full justify-center"
        />
      ))}
    </section>
  );
}

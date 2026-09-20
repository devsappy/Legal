import { getLocale, getTranslations } from "next-intl/server";
import clsx from "clsx";
import { Reveal } from "@/components/landing/Reveal";
import { CountUp } from "@/components/landing/CountUp";
import { HowTabs, type HowStep } from "@/components/landing/HowTabs";

export type StatItem = {
  key: string;
  label: string;
  /** null when the backend could not say; rendered as "—", never a made-up number. */
  value: number | null;
};

const SECTION = "relative mx-auto w-full max-w-[1400px] scroll-mt-[80px] px-4 py-16 sm:px-8 sm:py-24";
const KICKER = "text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3";
const BOX = "grid gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong";
const CELL = "cell bg-sheet p-5 sm:p-6";

/**
 * "How it works" as three tabs with drawn scenes, beside the live numbers.
 * The stats are a definition list (term before value in the DOM, value on
 * top visually); a number the backend could not supply shows a dash with
 * an explanation for readers and no count-up.
 */
export async function HowSection({ stats }: { stats: StatItem[] }) {
  const t = await getTranslations("landing");
  const locale = await getLocale();
  const steps = t.raw("how.steps") as HowStep[];

  return (
    <section id="how" className={SECTION}>
      <Reveal>
        <h2 className={KICKER}>{t("how.title")}</h2>
      </Reveal>
      <Reveal delay={100} className={clsx(BOX, "mt-4 lg:grid-cols-[3fr_1fr]")}>
        <HowTabs steps={steps} label={t("how.tabsLabel")} />
        <dl className="grid grid-cols-2 gap-px bg-rule-strong lg:grid-cols-1" data-stagger>
          {stats.map((s) => (
            <div key={s.key} className={clsx(CELL, "flex flex-col-reverse justify-end py-4 sm:py-5")}>
              <dt className="mt-1.5 text-xs font-medium text-ink-2">{s.label}</dt>
              <dd className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-brand tabular-nums">
                {s.value === null ? (
                  <>
                    <span className="font-mono" aria-hidden>
                      —
                    </span>
                    <span className="sr-only">{t("stats.unavailable")}</span>
                  </>
                ) : (
                  // Latin digits in every locale (Marathi would otherwise count in Devanagari).
                  <CountUp value={s.value} locale={`${locale}-u-nu-latn`} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

import { getTranslations } from "next-intl/server";
import clsx from "clsx";
import { Check, X } from "lucide-react";
import { JURISDICTIONS } from "@sahayak/shared";
import { Reveal } from "@/components/landing/Reveal";

const SECTION = "relative mx-auto w-full max-w-[1400px] scroll-mt-[80px] px-4 py-16 sm:px-8 sm:py-24";
const KICKER = "text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3";
const H2 = "mt-3 text-[clamp(26px,3vw,36px)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink";
const BOX = "grid gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong";
const CELL = "cell bg-sheet p-5 sm:p-6";

/** The six Acts the corpus covers, and what the assistant does and does not do. */
export async function ActsTrust() {
  const t = await getTranslations();
  const does = t.raw("landing.trust.does") as string[];
  const doesNot = t.raw("landing.trust.doesNot") as string[];

  return (
    <section id="acts" className={SECTION}>
      <Reveal className={clsx(BOX, "lg:grid-cols-[3fr_2fr]")}>
        <div className={CELL}>
          <p className={KICKER}>{t("nav.jurisdiction")}</p>
          <h2 className={H2}>{t("landing.actsTitle")}</h2>
          <ul className="mt-5 border-t border-rule-strong" data-stagger>
            {JURISDICTIONS.map((j) => (
              <li
                key={j.id}
                className="-mx-2 grid grid-cols-1 gap-x-4 rounded-sm border-b border-rule px-2 py-3 text-base hover:bg-muted/50 sm:grid-cols-[8.5rem_1fr_auto] sm:items-baseline"
              >
                <span className="font-mono text-xs text-brand">{j.short}</span>
                <span className="min-w-0 font-semibold text-ink">{j.name}</span>
                <span className="hidden truncate text-sm text-ink-3 sm:block">{j.act}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-px bg-rule-strong" data-stagger>
          <div className={CELL}>
            <p className={KICKER}>{t("landing.trust.title")}</p>
            <h3 className="mb-3 mt-3 text-[15px] font-semibold text-ink">{t("landing.trust.doesTitle")}</h3>
            <ul className="space-y-2.5">
              {does.map((d) => (
                <li key={d} className="flex gap-2.5 text-sm leading-snug text-ink-2">
                  <span className="cell-badge mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-sm bg-ink text-paper">
                    <Check size={13} strokeWidth={2.5} aria-hidden />
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className={CELL}>
            <h3 className="mb-3 text-[15px] font-semibold text-ink">{t("landing.trust.doesNotTitle")}</h3>
            <ul className="space-y-2.5">
              {doesNot.map((d) => (
                <li key={d} className="flex gap-2.5 text-sm leading-snug text-ink-2">
                  <span className="cell-outline mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-rule-strong text-ink">
                    <X size={13} strokeWidth={2.5} aria-hidden />
                  </span>
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-rule pt-4 text-xs text-ink-3">{t("app.notice")}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

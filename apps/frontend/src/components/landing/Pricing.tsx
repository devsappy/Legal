import { getLocale, getTranslations } from "next-intl/server";
import clsx from "clsx";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { formatNumber } from "@/lib/format";
import { PLANS } from "@/lib/plans";

const BOX = "grid gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong";
const CELL = "p-5 sm:p-6";

/* The recommended tile is ink on paper; its button has to be paper on ink
   by hand because the primary variant would vanish against the tile. */
const CTA_ON_INK =
  "inline-flex h-10 w-full items-center justify-center rounded-md bg-paper px-4 text-base font-medium text-ink transition-colors hover:bg-paper/90 active:translate-y-px";

/**
 * Three plans from lib/plans.ts: Member (free), Society (rupees per society
 * per year, Latin digits in every locale) and Federation (talk to us). The
 * Society tile is inverted and stamped "Pilot" and comes first on phones.
 * Every amount is indicative and the footnote says billing is not live.
 */
export async function Pricing() {
  const t = await getTranslations("landing.pricing");
  const locale = await getLocale();
  const email = t("contactEmail");

  return (
    <div>
      <div className={clsx(BOX, "lg:grid-cols-3")}>
        {PLANS.map((plan) => {
          const inverted = Boolean(plan.recommended);
          const features = t.raw(`plans.${plan.id}.features`) as string[];
          // Only a real amount is interpolated; "Free" and "Talk to us" are plain copy.
          const price = plan.amount
            ? t(`plans.${plan.id}.price`, { amount: formatNumber(plan.amount, locale) })
            : t(`plans.${plan.id}.price`);
          return (
            <div
              key={plan.id}
              className={clsx(
                "flex flex-col",
                CELL,
                inverted ? "order-first bg-ink text-paper lg:order-none" : "tile",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className={clsx("text-base font-semibold tracking-tight", inverted ? "text-paper" : "text-ink")}>
                  {t(`plans.${plan.id}.name`)}
                </h3>
                {inverted && (
                  <span className="stamp stamp--on-ink">
                    {t("recommended")}
                  </span>
                )}
              </div>
              <p className={clsx("mt-5 text-3xl font-medium tracking-tight tabular-nums", inverted ? "text-paper" : "text-ink")}>{price}</p>
              <p className={clsx("mt-1 text-xs", inverted ? "text-paper/70" : "text-ink-3")}>{t(`plans.${plan.id}.period`)}</p>
              <ul className="mt-6 flex flex-col gap-2.5">
                {features.map((f) => (
                  <li key={f} className={clsx("flex gap-2.5 text-sm leading-snug", inverted ? "text-paper/85" : "text-ink-2")}>
                    <span
                      className={clsx(
                        "mt-0.5 inline-flex size-4.5 shrink-0 items-center justify-center rounded-sm",
                        inverted ? "bg-paper text-ink" : "bg-ink text-paper",
                      )}
                      aria-hidden
                    >
                      <Check size={11} strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-7">
                {plan.href ? (
                  <Link href={plan.href} className={inverted ? CTA_ON_INK : buttonClasses("primary", "lg", "w-full")}>
                    {t(`plans.${plan.id}.cta`)}
                  </Link>
                ) : (
                  <a href={`mailto:${email}`} className={buttonClasses("outline", "lg", "w-full")}>
                    {t(`plans.${plan.id}.cta`)}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/login?demo=1"
        className="cell-link group mt-3 flex items-center justify-between gap-4 rounded-md border border-rule-strong bg-sheet p-5 sm:p-6"
      >
        <span className="min-w-0">
          <span className="block text-base font-medium tracking-tight text-ink">{t("demoTitle")}</span>
          <span className="mt-1 block text-sm text-ink-2">{t("demoBody")}</span>
        </span>
        <ArrowRight size={18} strokeWidth={1.75} className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
      </Link>

      <p className="mt-4 text-xs text-ink-3">{t("note")}</p>
    </div>
  );
}

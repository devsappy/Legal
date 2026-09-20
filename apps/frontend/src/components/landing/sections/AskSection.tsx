import { getTranslations } from "next-intl/server";
import clsx from "clsx";
import { Reveal } from "@/components/landing/Reveal";
import { PersonaSwitcher, type Persona, type Topic } from "@/components/landing/PersonaSwitcher";

const FEATURES = ["cites", "languages", "jurisdictions", "procedures"] as const;

const SECTION = "relative mx-auto w-full max-w-[1400px] scroll-mt-[80px] px-4 py-16 sm:px-8 sm:py-24";
const KICKER = "text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3";
const BOX = "grid gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong";
const CELL = "cell bg-sheet p-5 sm:p-6";

/**
 * Who it is for and what it does: the persona switcher (questions people in
 * each role actually ask, every tile a deep link into the assistant) over
 * the four feature tiles, which keep the landing's hover-invert treatment.
 */
export async function AskSection() {
  const t = await getTranslations("landing");
  const personas = t.raw("personas.items") as Persona[];
  const topics = t.raw("topics.items") as Topic[];

  return (
    <section id="ask" className={SECTION}>
      <Reveal>
        <h2 className={KICKER}>{t("topics.title")}</h2>
        <p className="mt-3 max-w-[30ch] text-[clamp(24px,2.6vw,32px)] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
          {t("personas.title")}
        </p>
      </Reveal>
      <Reveal delay={100} className="mt-6">
        <PersonaSwitcher personas={personas} topics={topics} />
      </Reveal>
      <Reveal as="ul" delay={250} className={clsx(BOX, "mt-3 sm:grid-cols-2 lg:grid-cols-4")}>
        <>
          {FEATURES.map((key) => (
            <li key={key} className={clsx(CELL, "cell--tint")}>
              <h3 className="text-[15px] font-semibold tracking-tight text-ink">{t(`features.${key}.title`)}</h3>
              <p className="mt-1.5 text-sm leading-[1.55] text-ink-2">{t(`features.${key}.body`)}</p>
            </li>
          ))}
        </>
      </Reveal>
    </section>
  );
}

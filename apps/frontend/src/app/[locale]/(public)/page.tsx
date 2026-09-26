import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { type Checklist, JURISDICTIONS, LANGUAGES } from "@sahayak/shared";
import { backendPublicResult } from "@/lib/backend";
import { Reveal } from "@/components/landing/Reveal";
import { Hero } from "@/components/landing/sections/Hero";
import { ActsStrip } from "@/components/landing/ActsStrip";
import { BenefitsBand } from "@/components/landing/sections/BenefitsBand";
import { HowSection, type StatItem } from "@/components/landing/sections/HowSection";
import { AskSection } from "@/components/landing/sections/AskSection";
import { ProceduresGlossary } from "@/components/landing/sections/ProceduresGlossary";
import { CompareTable } from "@/components/landing/CompareTable";
import { ActsTrust } from "@/components/landing/sections/ActsTrust";
import { FaqAccordion, type FaqItem } from "@/components/landing/FaqAccordion";
import { CtaBand } from "@/components/landing/sections/CtaBand";
import { JsonLd } from "@/components/landing/JsonLd";

const SECTION = "relative mx-auto w-full max-w-[1400px] scroll-mt-[80px] px-4 py-16 sm:px-8 sm:py-24";
const KICKER = "text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3";
const LEAD = "mt-3 max-w-[60ch] text-pretty text-lg text-ink-2";

type Stats = { sections: number; procedures: number; acts: number };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  return {
    title: t("title"),
    description: t("subtitle"),
    openGraph: { title: t("seo.ogTitle"), description: t("seo.ogDescription") },
    twitter: { title: t("seo.ogTitle"), description: t("seo.ogDescription") },
  };
}

/**
 * The marketing page: hero and product preview, Acts strip, benefits, how
 * it works with live numbers, personas, procedures and glossary, the
 * comparison, Acts and trust lists, FAQ and the closing
 * call to action. Live numbers come from the backend; when it does not
 * answer the page still renders, with dashes and an empty state instead
 * of invented figures.
 */
export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  const [procedures, live] = await Promise.all([
    backendPublicResult<{ procedures: Checklist[] }>("/api/procedures"),
    backendPublicResult<Stats>("/api/stats"),
  ]);
  const checklists: Checklist[] | null = procedures.ok ? (procedures.data.procedures ?? []) : null;
  const sections: number | null = live.ok && typeof live.data.sections === "number" ? live.data.sections : null;

  const stats: StatItem[] = [
    { key: "languages", label: t("stats.languages"), value: LANGUAGES.length },
    { key: "acts", label: t("stats.acts"), value: JURISDICTIONS.length },
    { key: "procedures", label: t("stats.procedures"), value: checklists ? checklists.length : null },
    { key: "sections", label: t("stats.sections"), value: sections },
  ];
  const faq = t.raw("faq.items") as FaqItem[];

  return (
    <div className="landing relative flex flex-1 flex-col bg-paper">
      <JsonLd locale={locale} />

      <Hero />
      <ActsStrip />
      <BenefitsBand />
      <HowSection stats={stats} />
      <AskSection />
      <ProceduresGlossary procedures={checklists} locale={locale} />

      <section id="compare" className={SECTION}>
        <Reveal>
          <h2 className={KICKER}>{t("compare.title")}</h2>
          <p className={LEAD}>{t("compare.body")}</p>
        </Reveal>
        <Reveal delay={100} className="mt-6">
          <CompareTable />
        </Reveal>
      </section>

      <ActsTrust />

      {/* Pricing is off the page while billing is not live; components/landing/Pricing.tsx puts it back. */}

      <section id="faq" className={SECTION}>
        <Reveal>
          <h2 className={KICKER}>{t("faq.title")}</h2>
        </Reveal>
        <Reveal delay={100} className="mt-4">
          <FaqAccordion items={faq} />
        </Reveal>
      </section>

      <CtaBand />
    </div>
  );
}

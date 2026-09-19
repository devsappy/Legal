import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, BookOpenCheck, Check, Languages, Scale, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { CHECKLISTS, DOCUMENTS, GLOSSARY, pick } from "@/lib/mock-data";
import { BrandMark } from "@/components/ui/BrandMark";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Skyline } from "@/components/landing/Skyline";
import { JurisdictionSelect } from "@/components/layout/JurisdictionSelect";
import { Reveal } from "@/components/landing/Reveal";
import { CountUp } from "@/components/landing/CountUp";

const FEATURES = ["cites", "languages", "jurisdictions", "procedures"] as const;

/* Boxy building blocks: a grid whose 1px gaps show the rule colour, so
   every cell is outlined without doubling borders. White cells on white
   paper, with the stronger rule so the grid reads crisply. */
const BOX = "grid gap-px bg-rule-strong border border-rule-strong rounded-md overflow-hidden";
const CELL = "cell bg-white dark:bg-sheet p-5 sm:p-6";
const SECTION = "relative mx-auto w-full max-w-[1400px] px-5 sm:px-8 py-12 sm:py-16 min-h-dvh flex flex-col justify-center";
const KICKER = "text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3 mb-3";
const H2 = "text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.03em] leading-[1.1] text-ink";
const BTN_PRIMARY =
  "group h-11 px-5 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-[14.5px] font-medium hover:bg-primary/90 transition-colors";
const BTN_DARK =
  "group h-11 px-5 inline-flex items-center gap-2 rounded-md bg-ink text-paper text-[14.5px] font-medium hover:opacity-90 transition-opacity";
const ARROW = "transition-transform group-hover:translate-x-0.5";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const steps = t.raw("landing.how.steps") as { title: string; body: string }[];
  const topics = t.raw("landing.topics.items") as { name: string; example: string }[];
  const does = t.raw("landing.trust.does") as string[];
  const doesNot = t.raw("landing.trust.doesNot") as string[];
  const faq = t.raw("landing.faq.items") as { q: string; a: string }[];

  const indexed = DOCUMENTS.filter((d) => d.status === "indexed").reduce((n, d) => n + d.chunks, 0);
  const stats = [
    { value: LANGUAGES.length, label: t("landing.stats.languages") },
    { value: JURISDICTIONS.length, label: t("landing.stats.acts") },
    { value: CHECKLISTS.length, label: t("landing.stats.procedures") },
    { value: indexed, label: t("landing.stats.sections") },
  ];
  const terms = GLOSSARY.slice(0, 5);

  return (
    <main className="landing relative flex-1 flex flex-col bg-white dark:bg-paper">

      {/* Header: brand, who-you-are picker, sign in, language */}
      <header className="nav-dark sticky top-0 z-30 bg-ink/75 backdrop-blur-md text-paper">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 h-[68px] flex items-center gap-2 sm:gap-3">
          <Link href="/" className="min-w-0 flex items-center gap-3 font-semibold tracking-tight text-[16px] text-paper">
            <BrandMark size={30} className="!bg-paper !text-ink" />
            <span className="hidden sm:inline truncate">{t("app.name")}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden md:inline-flex">
              <JurisdictionSelect size="md" />
            </span>
            <Link
              href="/login"
              className="h-9 px-5 inline-flex items-center whitespace-nowrap rounded-full border border-white/30 text-[14px] font-medium text-paper hover:bg-white/10 transition-colors"
            >
              {t("login.title")}
            </Link>
            <LanguageSwitcher size="md" />
          </div>
        </div>
      </header>

      {/* 1 · Hero: centred claim over a line-art streetscape, benefits band below */}
      <section className="relative w-full min-h-[calc(100dvh-68px-3.5rem)] flex flex-col overflow-hidden">
        <div className="my-auto mx-auto w-full max-w-[1400px] px-5 sm:px-8 pt-10 sm:pt-14 pb-6 flex flex-col items-center text-center">
          <Reveal>
            <p className={KICKER}>{t("landing.eyebrow")}</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-[clamp(30px,4vw,50px)] font-semibold tracking-[-0.03em] leading-[1.08] text-ink text-balance max-w-[22ch]">
              {t("landing.title")}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 text-[16px] sm:text-[17.5px] text-ink-2 leading-[1.55] max-w-[46ch] text-pretty">
              {t("landing.subtitle")}
            </p>
          </Reveal>
          <Reveal delay={240}>
            <Link href="/login" className={`${BTN_PRIMARY} mt-7 h-12 px-7 text-[15px]`}>
              {t("landing.ctaDemo")}
              <ArrowRight size={16} className={ARROW} aria-hidden />
            </Link>
          </Reveal>
        </div>
        {/* Edge to edge on wide screens; phones keep a minimum width and see the centre of the street */}
        <Skyline className="skyline w-[max(100%,1200px)] max-w-none h-auto self-center text-rule-strong shrink-0 -mb-px" />
      </section>

      {/* Benefits band */}
      <div className="relative bg-brand text-primary-foreground">
        <ul className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 min-h-14 py-3 grid gap-y-3 sm:grid-cols-3 items-center text-[13.5px] font-medium">
          {[
            { icon: BookOpenCheck, label: t("landing.features.cites.title") },
            { icon: Languages, label: LANGUAGES.map((l) => l.native).join(" · ") },
            { icon: Scale, label: t("landing.features.jurisdictions.title") },
          ].map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 sm:justify-center">
              <Icon size={20} strokeWidth={1.75} className="shrink-0 opacity-90" aria-hidden />
              <span className="truncate">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 2 · How it works + the numbers */}
      <section className={SECTION}>
        <Reveal>
          <p className={KICKER}>{t("landing.how.title")}</p>
        </Reveal>
        <Reveal delay={100} className={`${BOX} lg:grid-cols-[3fr_1fr] mt-4`}>
          <ol className="grid sm:grid-cols-3 gap-px bg-rule-strong" data-stagger>
            {steps.map((s, i) => (
              <li key={s.title} className={CELL}>
                <span className="cell-badge inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand text-primary-foreground font-mono text-[12px] font-semibold">
                  {i + 1}
                </span>
                <h2 className="mt-7 text-[19px] font-semibold tracking-tight text-ink">{s.title}</h2>
                <p className="mt-2 text-[14.5px] text-ink-2 leading-[1.6]">{s.body}</p>
              </li>
            ))}
          </ol>
          <dl className="grid grid-cols-2 lg:grid-cols-1 gap-px bg-rule-strong" data-stagger>
            {stats.map((s) => (
              <div key={s.label} className={`${CELL} py-4 sm:py-5`}>
                <dd className="text-[34px] font-semibold tracking-[-0.03em] text-brand leading-none tabular-nums">
                  <CountUp value={s.value} locale={locale} />
                </dd>
                <dt className="mt-1.5 text-[12.5px] font-medium text-ink-2">{s.label}</dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* 3 · What you can ask + what it does */}
      <section className={SECTION}>
        <Reveal>
          <p className={KICKER}>{t("landing.topics.title")}</p>
        </Reveal>
        <Reveal as="ul" delay={100} className={`${BOX} sm:grid-cols-2 lg:grid-cols-3 mt-4`}>
          <>
            {topics.map((tp) => (
              <li key={tp.name} className={`${CELL} group`}>
                <h2 className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-ink">
                  <span className="cell-badge h-2 w-2 rounded-sm bg-brand transition-transform group-hover:scale-125" aria-hidden />
                  {tp.name}
                </h2>
                <p className="mt-2 text-[14px] text-ink-2 leading-[1.55]">“{tp.example}”</p>
              </li>
            ))}
          </>
        </Reveal>
        <Reveal as="ul" delay={250} className={`${BOX} sm:grid-cols-2 lg:grid-cols-4 mt-3`}>
          <>
            {FEATURES.map((key) => (
              <li key={key} className={`${CELL} cell--tint`}>
                <h3 className="text-[15px] font-semibold tracking-tight text-ink">{t(`landing.features.${key}.title`)}</h3>
                <p className="mt-1.5 text-[13.5px] text-ink-2 leading-[1.55]">{t(`landing.features.${key}.body`)}</p>
              </li>
            ))}
          </>
        </Reveal>
      </section>

      {/* 4 · Procedures + glossary */}
      <section className={SECTION}>
        <Reveal className={`${BOX} lg:grid-cols-[2fr_1fr]`}>
          <div className="grid gap-px bg-rule-strong">
            <div className={CELL}>
              <p className={KICKER}>{t("nav.checklists")}</p>
              <h2 className={H2}>{t("landing.procedures.title")}</h2>
              <p className="mt-2 text-[15px] text-ink-2 max-w-[60ch]">{t("landing.procedures.body")}</p>
            </div>
            <ul className="grid sm:grid-cols-2 gap-px bg-rule-strong" data-stagger>
              {CHECKLISTS.map((c) => {
                const j = JURISDICTIONS.find((x) => x.id === c.jurisdiction);
                return (
                  <li key={c.slug} className={`${CELL} flex flex-col`}>
                    <span className="font-mono text-[11px] text-ink-3">
                      {j?.short} · {t("landing.procedures.steps", { count: c.steps.length })}
                    </span>
                    <h3 className="mt-3 text-[16.5px] font-semibold tracking-tight text-ink">{pick(c.title, locale)}</h3>
                    <p className="mt-1.5 text-[13.5px] text-ink-2 leading-[1.55] flex-1">{pick(c.summary, locale)}</p>
                    <Link href="/login" className="group mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-ink transition-colors">
                      {t("landing.procedures.open")} <ArrowRight size={13} className={ARROW} aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className={`${CELL} flex flex-col`}>
            <p className={KICKER}>{t("admin.glossary")}</p>
            <h2 className="text-[22px] font-semibold tracking-tight text-ink">{t("landing.glossary.title")}</h2>
            <p className="mt-2 text-[14px] text-ink-2">{t("landing.glossary.body")}</p>
            <table className="mt-5 w-full text-[13px] border-t border-rule-strong">
              <tbody>
                {terms.map((g) => (
                  <tr key={g.term} className="border-b border-rule align-top">
                    <th scope="row" className="py-2.5 pr-3 text-left font-semibold text-ink whitespace-nowrap">{g.term}</th>
                    <td className="py-2.5 text-ink-2">
                      {g.hi} · {g.mr} · {g.ta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* 5 · Acts + what it is and isn't */}
      <section className={SECTION}>
        <Reveal className={`${BOX} lg:grid-cols-[3fr_2fr]`}>
          <div className={CELL}>
            <p className={KICKER}>{t("nav.jurisdiction")}</p>
            <h2 className={H2}>{t("landing.actsTitle")}</h2>
            <ul className="mt-5 border-t border-rule-strong" data-stagger>
              {JURISDICTIONS.map((j) => (
                <li key={j.id} className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[8.5rem_1fr_auto] gap-x-4 items-baseline py-3 border-b border-rule text-[15px] hover:bg-muted/50 -mx-2 px-2 rounded-sm">
                  <span className="font-mono text-[12.5px] text-brand">{j.short}</span>
                  <span className="text-ink font-semibold">{j.name}</span>
                  <span className="hidden sm:block text-[13px] text-ink-3 truncate">{j.act}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-px bg-rule-strong" data-stagger>
            <div className={CELL}>
              <p className={KICKER}>{t("landing.trust.title")}</p>
              <h3 className="text-[15px] font-semibold text-ink mb-3">{t("landing.trust.doesTitle")}</h3>
              <ul className="space-y-2.5">
                {does.map((d) => (
                  <li key={d} className="flex gap-2.5 text-[14px] text-ink-2 leading-snug">
                    <span className="cell-badge mt-0.5 h-5 w-5 shrink-0 rounded-sm bg-ink text-paper inline-flex items-center justify-center">
                      <Check size={13} strokeWidth={2.5} aria-hidden />
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className={CELL}>
              <h3 className="text-[15px] font-semibold text-ink mb-3">{t("landing.trust.doesNotTitle")}</h3>
              <ul className="space-y-2.5">
                {doesNot.map((d) => (
                  <li key={d} className="flex gap-2.5 text-[14px] text-ink-2 leading-snug">
                    <span className="cell-outline mt-0.5 h-5 w-5 shrink-0 rounded-sm border border-rule-strong text-ink inline-flex items-center justify-center">
                      <X size={13} strokeWidth={2.5} aria-hidden />
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
              <p className="mt-5 pt-4 border-t border-rule text-[12.5px] text-ink-3">{t("app.notice")}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 6 · FAQ + call to action */}
      <section className={SECTION}>
        <Reveal>
          <p className={KICKER}>{t("landing.faq.title")}</p>
        </Reveal>
        <Reveal as="dl" delay={100} className={`${BOX} sm:grid-cols-2 mt-4`}>
          <>
            {faq.map((f) => (
              <div key={f.q} className={CELL}>
                <dt className="text-[16px] font-semibold tracking-tight text-ink">{f.q}</dt>
                <dd className="mt-2 text-[14px] text-ink-2 leading-[1.6]">{f.a}</dd>
              </div>
            ))}
          </>
        </Reveal>
        <Reveal delay={250} className="mt-3 rounded-md bg-ink text-paper p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <h2 className="text-[clamp(22px,2.6vw,30px)] font-semibold tracking-[-0.03em] leading-tight">{t("landing.cta.title")}</h2>
            <p className="mt-2 text-[15px] opacity-75">{t("landing.cta.body")}</p>
          </div>
          <Link href="/login" className={`${BTN_DARK} !bg-primary !text-primary-foreground shrink-0`}>
            {t("landing.ctaDemo")}
            <ArrowRight size={16} className={ARROW} aria-hidden />
          </Link>
        </Reveal>
      </section>

      <footer className="relative border-t border-rule-strong mt-auto bg-white dark:bg-paper">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 h-14 flex items-center gap-4 text-[12.5px] text-ink-3">
          <span className="truncate">{t("app.notice")}</span>
          <Link href="/login" className="group ml-auto shrink-0 inline-flex items-center gap-1 text-ink-2 hover:text-ink">
            {t("landing.footerSignIn")} <ArrowRight size={12} className={ARROW} aria-hidden />
          </Link>
        </div>
      </footer>
    </main>
  );
}

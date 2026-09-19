import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Check, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { CHECKLISTS, DOCUMENTS, GLOSSARY, MOCK_ANSWER, pick } from "@/lib/mock-data";
import { BrandMark } from "@/components/ui/BrandMark";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ShaderBackdrop } from "@/components/landing/ShaderBackdrop";

const FEATURES = ["cites", "languages", "jurisdictions", "procedures"] as const;

/* Boxy building blocks: a grid whose 1px gaps show the rule colour, so
   every cell is outlined without doubling borders. */
const BOX = "grid gap-px bg-rule border border-rule rounded-md overflow-hidden";
const CELL = "bg-sheet p-5 sm:p-6";
const SECTION = "relative mx-auto w-full max-w-[1400px] px-5 sm:px-8 py-12 sm:py-16 min-h-dvh flex flex-col justify-center";
const KICKER = "text-[12px] font-semibold uppercase tracking-[0.12em] text-violet mb-3";
const H2 = "text-[clamp(26px,3vw,36px)] font-medium tracking-[-0.03em] leading-[1.1] text-ink";

/** Turns "[2]" markers into the same citation chips the assistant uses. */
function withCites(text: string) {
  return text.split(/(\[\d+\])/).map((part, i) => {
    const m = /^\[(\d+)\]$/.exec(part);
    return m ? (
      <span key={i} className="cite" aria-label={`Source ${m[1]}`}>
        {m[1]}
      </span>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const examples = t.raw("chat.examples") as { topic: string; question: string }[];
  const question = examples[1].question;
  const answer = pick(MOCK_ANSWER.text, locale).split("\n\n")[0];
  const sources = MOCK_ANSWER.citations.slice(0, 2);
  const central = JURISDICTIONS[0];
  const language = LANGUAGES.find((l) => l.code === locale)?.native;

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
    { value: indexed.toLocaleString(locale), label: t("landing.stats.sections") },
  ];
  const terms = GLOSSARY.slice(0, 5);

  return (
    <main className="landing relative flex-1 flex flex-col bg-paper">
      <ShaderBackdrop />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-rule">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 h-16 flex items-center gap-3">
          <Link href="/" className="min-w-0 flex items-center gap-2.5 font-semibold tracking-tight text-[15px] text-ink">
            <BrandMark />
            <span className="truncate">{t("app.name")}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex">
              <LanguageSwitcher />
            </span>
            <Link
              href="/login"
              className="hidden sm:inline-flex h-9 px-3.5 items-center whitespace-nowrap rounded-md text-[13.5px] font-medium text-ink-2 hover:text-ink hover:bg-muted transition-colors"
            >
              {t("landing.ctaSignIn")}
            </Link>
            <Link
              href="/login"
              className="h-9 px-4 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-ink text-paper text-[13.5px] font-medium hover:opacity-90 transition-opacity"
            >
              {t("landing.ctaDemo")}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      {/* 1 · Hero: the claim on the left, the proof on the right */}
      <section className="relative rise mx-auto w-full max-w-[1400px] px-5 sm:px-8 py-12 sm:py-16 min-h-[calc(100dvh-4rem)] grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 items-center content-center">
        <div>
          <p className={KICKER}>{t("landing.eyebrow")}</p>
          <h1 className="text-[clamp(36px,4.6vw,58px)] font-medium tracking-[-0.035em] leading-[1.04] text-ink text-balance">
            {t("landing.title")}
          </h1>
          <p className="mt-6 text-[17px] sm:text-[19px] text-ink-2 leading-[1.55] max-w-[50ch] text-pretty">
            {t("landing.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="h-11 px-5 inline-flex items-center gap-2 rounded-md bg-ink text-paper text-[14.5px] font-medium hover:opacity-90 transition-opacity"
            >
              {t("landing.ctaDemo")}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/login"
              className="h-11 px-5 inline-flex items-center rounded-md border border-rule-strong bg-sheet text-[14.5px] font-medium text-ink hover:bg-muted transition-colors"
            >
              {t("landing.ctaSignIn")}
            </Link>
          </div>
          <p className="mt-8 text-[13px] text-ink-3">{LANGUAGES.map((l) => l.native).join("  ·  ")}</p>
        </div>

        <figure className="w-full rounded-md border border-rule bg-sheet overflow-hidden">
          <figcaption className="h-11 px-4 flex items-center gap-3 border-b border-rule bg-muted/50">
            <span className="text-[12.5px] font-medium text-ink-2">{t("landing.sampleLabel")}</span>
            <span className="ml-auto font-mono text-[11px] text-ink-3 truncate">
              {central.short} · {language}
            </span>
          </figcaption>
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-md bg-violet-soft text-ink px-4 py-2.5 text-[14.5px]">{question}</p>
            </div>
            <div className="margin-rule pl-4 sm:pl-5">
              <p className="text-[12.5px] font-medium text-ink-2 mb-1.5">{t("chat.assistant")}</p>
              <p className="text-[14.5px] leading-[1.65] text-ink">{withCites(answer)}</p>
              <ul className="mt-4 space-y-1.5">
                {sources.map((c) => (
                  <li key={c.id} className="flex items-baseline gap-2.5 text-[13px]">
                    <span className="cite">{c.id}</span>
                    <span className="font-mono text-[12px] text-ink-3 shrink-0">{c.section}</span>
                    <span className="text-ink-2 truncate">{c.title}</span>
                    {c.verified && (
                      <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[11.5px] text-verified">
                        <Check size={12} strokeWidth={2.5} aria-hidden /> {t("chat.verifiedShort")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <span className="stamp mt-4">{t("chat.stamp")}</span>
            </div>
          </div>
        </figure>
      </section>

      {/* 2 · How it works + the numbers */}
      <section className={SECTION}>
        <p className={KICKER}>{t("landing.how.title")}</p>
        <div className={`${BOX} lg:grid-cols-[3fr_1fr] mt-4`}>
          <ol className="grid sm:grid-cols-3 gap-px bg-rule">
            {steps.map((s, i) => (
              <li key={s.title} className={CELL}>
                <span className="font-mono text-[12px] text-violet">0{i + 1}</span>
                <h2 className="mt-8 text-[19px] font-medium tracking-tight text-ink">{s.title}</h2>
                <p className="mt-2 text-[14.5px] text-ink-2 leading-[1.6]">{s.body}</p>
              </li>
            ))}
          </ol>
          <dl className="grid grid-cols-2 lg:grid-cols-1 gap-px bg-rule">
            {stats.map((s) => (
              <div key={s.label} className={`${CELL} py-4 sm:py-5`}>
                <dd className="text-[30px] font-medium tracking-[-0.03em] text-ink leading-none">{s.value}</dd>
                <dt className="mt-1.5 text-[12.5px] text-ink-3">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 3 · What you can ask + what it does */}
      <section className={SECTION}>
        <p className={KICKER}>{t("landing.topics.title")}</p>
        <ul className={`${BOX} sm:grid-cols-2 lg:grid-cols-3 mt-4`}>
          {topics.map((tp) => (
            <li key={tp.name} className={CELL}>
              <h2 className="text-[16px] font-medium tracking-tight text-ink">{tp.name}</h2>
              <p className="mt-1.5 text-[14px] text-ink-2 leading-[1.55]">“{tp.example}”</p>
            </li>
          ))}
        </ul>
        <ul className={`${BOX} sm:grid-cols-2 lg:grid-cols-4 mt-3`}>
          {FEATURES.map((key) => (
            <li key={key} className={`${CELL} bg-muted/40`}>
              <h3 className="text-[15px] font-medium tracking-tight text-ink">{t(`landing.features.${key}.title`)}</h3>
              <p className="mt-1.5 text-[13.5px] text-ink-2 leading-[1.55]">{t(`landing.features.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 4 · Procedures + glossary */}
      <section className={SECTION}>
        <div className={`${BOX} lg:grid-cols-[2fr_1fr]`}>
          <div className="grid gap-px bg-rule">
            <div className={CELL}>
              <p className={KICKER}>{t("nav.checklists")}</p>
              <h2 className={H2}>{t("landing.procedures.title")}</h2>
              <p className="mt-2 text-[15px] text-ink-2 max-w-[60ch]">{t("landing.procedures.body")}</p>
            </div>
            <ul className="grid sm:grid-cols-2 gap-px bg-rule">
              {CHECKLISTS.map((c) => {
                const j = JURISDICTIONS.find((x) => x.id === c.jurisdiction);
                return (
                  <li key={c.slug} className={`${CELL} flex flex-col`}>
                    <span className="font-mono text-[11px] text-ink-3">
                      {j?.short} · {t("landing.procedures.steps", { count: c.steps.length })}
                    </span>
                    <h3 className="mt-3 text-[16.5px] font-medium tracking-tight text-ink">{pick(c.title, locale)}</h3>
                    <p className="mt-1.5 text-[13.5px] text-ink-2 leading-[1.55] flex-1">{pick(c.summary, locale)}</p>
                    <Link href="/login" className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-ink hover:text-violet">
                      {t("landing.procedures.open")} <ArrowRight size={13} aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className={`${CELL} flex flex-col`}>
            <p className={KICKER}>{t("admin.glossary")}</p>
            <h2 className="text-[22px] font-medium tracking-tight text-ink">{t("landing.glossary.title")}</h2>
            <p className="mt-2 text-[14px] text-ink-2">{t("landing.glossary.body")}</p>
            <table className="mt-5 w-full text-[13px] border-t border-rule">
              <tbody>
                {terms.map((g) => (
                  <tr key={g.term} className="border-b border-rule align-top">
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium text-ink whitespace-nowrap">{g.term}</th>
                    <td className="py-2.5 text-ink-2">
                      {g.hi} · {g.mr} · {g.ta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5 · Acts + what it is and isn't */}
      <section className={SECTION}>
        <div className={`${BOX} lg:grid-cols-[3fr_2fr]`}>
          <div className={CELL}>
            <p className={KICKER}>{t("nav.jurisdiction")}</p>
            <h2 className={H2}>{t("landing.actsTitle")}</h2>
            <ul className="mt-5 border-t border-rule">
              {JURISDICTIONS.map((j) => (
                <li key={j.id} className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[8.5rem_1fr_auto] gap-x-4 items-baseline py-3 border-b border-rule text-[15px]">
                  <span className="font-mono text-[12.5px] text-violet">{j.short}</span>
                  <span className="text-ink font-medium">{j.name}</span>
                  <span className="hidden sm:block text-[13px] text-ink-3 truncate">{j.act}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-px bg-rule">
            <div className={CELL}>
              <p className={KICKER}>{t("landing.trust.title")}</p>
              <h3 className="text-[15px] font-medium text-ink mb-3">{t("landing.trust.doesTitle")}</h3>
              <ul className="space-y-2.5">
                {does.map((d) => (
                  <li key={d} className="flex gap-2.5 text-[14px] text-ink-2 leading-snug">
                    <Check size={16} className="shrink-0 text-verified mt-0.5" strokeWidth={2.5} aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className={CELL}>
              <h3 className="text-[15px] font-medium text-ink mb-3">{t("landing.trust.doesNotTitle")}</h3>
              <ul className="space-y-2.5">
                {doesNot.map((d) => (
                  <li key={d} className="flex gap-2.5 text-[14px] text-ink-2 leading-snug">
                    <X size={16} className="shrink-0 text-seal mt-0.5" strokeWidth={2.5} aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
              <p className="mt-5 pt-4 border-t border-rule text-[12.5px] text-ink-3">{t("app.notice")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6 · FAQ + call to action */}
      <section className={SECTION}>
        <p className={KICKER}>{t("landing.faq.title")}</p>
        <dl className={`${BOX} sm:grid-cols-2 mt-4`}>
          {faq.map((f) => (
            <div key={f.q} className={CELL}>
              <dt className="text-[16px] font-medium tracking-tight text-ink">{f.q}</dt>
              <dd className="mt-2 text-[14px] text-ink-2 leading-[1.6]">{f.a}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 rounded-md bg-ink text-paper p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <h2 className="text-[clamp(22px,2.6vw,30px)] font-medium tracking-[-0.03em] leading-tight">{t("landing.cta.title")}</h2>
            <p className="mt-2 text-[15px] opacity-75">{t("landing.cta.body")}</p>
          </div>
          <Link
            href="/login"
            className="shrink-0 h-11 px-5 inline-flex items-center gap-2 rounded-md bg-paper text-ink text-[14.5px] font-medium hover:opacity-90 transition-opacity"
          >
            {t("landing.ctaDemo")}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-rule mt-auto bg-paper">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 h-14 flex items-center gap-4 text-[12.5px] text-ink-3">
          <span className="truncate">{t("app.notice")}</span>
          <Link href="/login" className="ml-auto shrink-0 inline-flex items-center gap-1 text-ink-2 hover:text-ink">
            {t("landing.footerSignIn")} <ArrowRight size={12} aria-hidden />
          </Link>
        </div>
      </footer>
    </main>
  );
}

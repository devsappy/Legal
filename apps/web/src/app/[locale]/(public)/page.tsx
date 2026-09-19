import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { MOCK_ANSWER, pick } from "@/lib/mock-data";
import { BrandMark } from "@/components/ui/BrandMark";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const FEATURES = ["cites", "languages", "jurisdictions", "procedures"] as const;

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

  return (
    <main className="flex-1 flex flex-col bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-rule">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 h-16 flex items-center gap-3">
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
              className="hidden sm:inline-flex h-9 px-3.5 items-center whitespace-nowrap rounded-full text-[13.5px] font-medium text-ink-2 hover:text-ink hover:bg-muted transition-colors"
            >
              {t("landing.ctaSignIn")}
            </Link>
            <Link
              href="/login"
              className="h-9 px-4 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink text-paper text-[13.5px] font-medium hover:opacity-90 transition-opacity"
            >
              {t("landing.ctaDemo")}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero: the claim on the left, the proof on the right */}
      <section className="rise mx-auto w-full max-w-6xl px-5 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-24 grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 items-center">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-violet mb-5">{t("landing.eyebrow")}</p>
          <h1 className="text-[clamp(36px,4.6vw,58px)] font-medium tracking-[-0.035em] leading-[1.04] text-ink text-balance">
            {t("landing.title")}
          </h1>
          <p className="mt-6 text-[17px] sm:text-[19px] text-ink-2 leading-[1.55] max-w-[50ch] text-pretty">
            {t("landing.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="h-11 px-5 inline-flex items-center gap-2 rounded-full bg-ink text-paper text-[14.5px] font-medium hover:opacity-90 transition-opacity"
            >
              {t("landing.ctaDemo")}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/login"
              className="h-11 px-5 inline-flex items-center rounded-full border border-rule-strong text-[14.5px] font-medium text-ink hover:bg-muted transition-colors"
            >
              {t("landing.ctaSignIn")}
            </Link>
          </div>
          <p className="mt-8 text-[13px] text-ink-3">{LANGUAGES.map((l) => l.native).join("  ·  ")}</p>
        </div>

        {/* Sample answer, rendered exactly as the assistant renders it */}
        <figure className="w-full rounded-2xl border border-rule bg-sheet overflow-hidden">
          <figcaption className="h-11 px-4 flex items-center gap-3 border-b border-rule">
            <span className="text-[12.5px] font-medium text-ink-2">{t("landing.sampleLabel")}</span>
            <span className="ml-auto font-mono text-[11px] text-ink-3 truncate">
              {central.short} · {language}
            </span>
          </figcaption>
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-violet-soft text-ink px-4 py-2.5 text-[14.5px]">{question}</p>
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

      {/* What it does: a ruled list, not boxes */}
      <section className="mx-auto w-full max-w-6xl px-5 sm:px-6 pb-16 sm:pb-24">
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
          {FEATURES.map((key) => (
            <li key={key} className="border-t border-rule-strong pt-5">
              <h2 className="text-[17px] font-medium tracking-tight text-ink mb-2">{t(`landing.features.${key}.title`)}</h2>
              <p className="text-[14.5px] text-ink-2 leading-[1.6] text-pretty">{t(`landing.features.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Acts */}
      <section className="mx-auto w-full max-w-6xl px-5 sm:px-6 pb-20 sm:pb-28 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-3 pt-1">{t("landing.actsTitle")}</h2>
        <ul className="border-t border-rule">
          {JURISDICTIONS.map((j) => (
            <li key={j.id} className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[8.5rem_1fr_auto] gap-x-4 items-baseline py-3.5 border-b border-rule text-[15px]">
              <span className="font-mono text-[12.5px] text-violet">{j.short}</span>
              <span className="text-ink font-medium">{j.name}</span>
              <span className="hidden sm:block text-[13px] text-ink-3 truncate">{j.act}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-rule mt-auto">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 h-14 flex items-center gap-4 text-[12.5px] text-ink-3">
          <span className="truncate">{t("app.notice")}</span>
          <Link href="/login" className="ml-auto shrink-0 inline-flex items-center gap-1 text-ink-2 hover:text-ink">
            {t("landing.footerSignIn")} <ArrowRight size={12} aria-hidden />
          </Link>
        </div>
      </footer>
    </main>
  );
}

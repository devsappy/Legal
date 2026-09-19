import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, BookOpenCheck, Check, Languages, ListChecks, MapPinned } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { MOCK_ANSWER, pick } from "@/lib/mock-data";
import { BrandMark } from "@/components/ui/BrandMark";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

const FEATURES = [
  { key: "cites", icon: BookOpenCheck },
  { key: "languages", icon: Languages },
  { key: "jurisdictions", icon: MapPinned },
  { key: "procedures", icon: ListChecks },
] as const;

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
    <main className="flex-1 flex flex-col bg-paper landing-glow">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur border-b border-rule/60">
        <div className="mx-auto w-full max-w-6xl px-5 h-16 flex items-center gap-3">
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

      {/* Hero */}
      <section className="rise mx-auto w-full max-w-6xl px-5 pt-14 sm:pt-20 pb-10 flex flex-col items-center text-center">
        <div className="orb mb-8" aria-hidden />
        <p className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-violet mb-4">{t("landing.eyebrow")}</p>
        <h1 className="text-[clamp(32px,5.5vw,56px)] text-ink max-w-[20ch] leading-[1.05]">{t("landing.title")}</h1>
        <p className="mt-5 text-[16px] sm:text-[17.5px] text-ink-2 max-w-[56ch] leading-relaxed">{t("landing.subtitle")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="h-11 px-5 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground text-[14.5px] font-medium hover:bg-primary/90 transition-colors shadow-[0_8px_24px_-10px_var(--violet)]"
          >
            {t("landing.ctaDemo")}
            <ArrowRight size={16} aria-hidden />
          </Link>
          <Link
            href="/login"
            className="h-11 px-5 inline-flex items-center rounded-full border border-rule bg-sheet text-[14.5px] font-medium text-ink hover:border-violet/50 transition-colors"
          >
            {t("landing.ctaSignIn")}
          </Link>
        </div>

        {/* Sample answer, rendered exactly as the assistant renders it */}
        <figure className="mt-14 w-full max-w-3xl text-left rounded-2xl border border-rule bg-sheet overflow-hidden shadow-[0_1px_2px_rgba(9,9,11,0.04),0_30px_80px_-40px_color-mix(in_srgb,var(--violet)_50%,transparent)]">
          <figcaption className="h-11 px-4 flex items-center gap-3 border-b border-rule/70 bg-muted/40">
            <span className="text-[12.5px] font-medium text-ink-2">{t("landing.sampleLabel")}</span>
            <span className="ml-auto font-mono text-[11px] text-ink-3 truncate">
              {central.short} · {language}
            </span>
          </figcaption>
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-violet-soft text-ink px-4 py-2.5 text-[15px]">{question}</p>
            </div>
            <div className="margin-rule pl-4 sm:pl-6">
              <p className="text-[12.5px] font-medium text-ink-2 mb-1.5">{t("chat.assistant")}</p>
              <p className="text-[15px] leading-[1.65] text-ink max-w-[68ch]">{withCites(answer)}</p>
              <ul className="mt-4 space-y-1.5 max-w-[68ch]">
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

      {/* What it does */}
      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ key, icon: Icon }) => (
            <li key={key} className="rounded-xl border border-rule bg-sheet p-5">
              <span className="h-9 w-9 rounded-lg bg-violet-soft text-violet flex items-center justify-center mb-4">
                <Icon size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <h2 className="text-[15.5px] font-medium text-ink mb-1.5 tracking-normal">{t(`landing.features.${key}.title`)}</h2>
              <p className="text-[13.5px] text-ink-2 leading-relaxed">{t(`landing.features.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Acts */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:pb-24">
        <div className="rounded-2xl border border-rule bg-muted/50 p-6 sm:p-8">
          <h2 className="text-[13px] font-medium text-ink-2 tracking-normal mb-4">{t("landing.actsTitle")}</h2>
          <ul className="flex flex-wrap gap-2">
            {JURISDICTIONS.map((j) => (
              <li
                key={j.id}
                className="inline-flex items-center gap-2 h-9 pl-3 pr-3.5 rounded-full border border-rule bg-sheet text-[13px] text-ink"
              >
                <span className="font-mono text-[11px] text-violet">{j.short}</span>
                <span className="text-ink-2">{j.name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[13px] text-ink-3">
            {LANGUAGES.map((l) => l.native).join(" · ")}
          </p>
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto w-full max-w-6xl px-5 h-14 flex items-center gap-4 text-[12px] text-ink-3">
          <span className="truncate">{t("app.notice")}</span>
          <Link href="/login" className="ml-auto shrink-0 inline-flex items-center gap-1 text-ink-2 hover:text-ink">
            {t("landing.footerSignIn")} <ArrowRight size={12} aria-hidden />
          </Link>
        </div>
      </footer>
    </main>
  );
}

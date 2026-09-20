import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/ui/BrandMark";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return { title: t("title") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const sections = t.raw("legal.privacy.sections") as { heading: string; body: string }[];

  return (
    <main className="flex-1 flex flex-col bg-paper">
      <header className="nav-dark bg-ink/75 backdrop-blur-md text-paper">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 h-[68px] flex items-center gap-3">
          <Link href="/" className="min-w-0 flex items-center gap-3 font-semibold tracking-tight text-[16px] text-paper">
            <BrandMark size={30} className="!bg-paper !text-ink" />
            <span className="truncate">{t("app.name")}</span>
          </Link>
        </div>
      </header>
      <article className="mx-auto w-full max-w-[72ch] px-5 py-12 sm:py-16">
        <h1 className="text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.03em] text-ink">{t("legal.privacy.title")}</h1>
        <p className="mt-3 text-[14px] text-ink-3">{t("legal.updated")}</p>
        {sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2 className="text-[19px] font-semibold tracking-tight text-ink mb-2">{s.heading}</h2>
            <p className="text-[15.5px] text-ink-2 leading-[1.65] whitespace-pre-line">{s.body}</p>
          </section>
        ))}
        <p className="mt-12 text-[13px]">
          <Link href="/" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
            <ArrowLeft size={14} aria-hidden /> {t("login.back")}
          </Link>
        </p>
      </article>
      <p className="px-4 py-4 text-center text-[11.5px] text-ink-3">{t("app.notice")}</p>
    </main>
  );
}

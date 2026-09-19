import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CHECKLISTS, pick } from "@/lib/mock-data";
import { JURISDICTIONS } from "@/lib/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checklists" });
  return { title: t("title") };
}

export default async function ChecklistsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checklists");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="max-w-[62ch] mb-8">
        <h1 className="text-[clamp(28px,4vw,38px)] mb-2">{t("title")}</h1>
        <p className="text-ink-2 text-[15.5px]">{t("subtitle")}</p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CHECKLISTS.map((c) => {
          const j = JURISDICTIONS.find((x) => x.id === c.jurisdiction);
          return (
            <li key={c.slug}>
              <Link
                href={`/checklists/${c.slug}`}
                className="group flex flex-col h-full rounded-lg border border-rule bg-sheet p-4 hover:border-brand transition-colors"
              >
                <span className="font-mono text-[11px] text-ink-3 tracking-wide mb-2">
                  {j?.short} · {t("stepCount", { count: c.steps.length })}
                </span>
                <span className="text-[17px] font-medium text-ink leading-snug mb-1.5">
                  {pick(c.title, locale)}
                </span>
                <span className="text-[13.5px] text-ink-2 flex-1">{pick(c.summary, locale)}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] text-ink-2 group-hover:text-ink">
                  {t("steps")}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, CalendarClock, FileText, IndianRupee } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/mock-data";
import { findProcedure, loadProcedures } from "@/lib/procedures";
import { JURISDICTIONS } from "@/lib/config";
import { routing } from "@/i18n/routing";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateStaticParams() {
  const all = await loadProcedures();
  return routing.locales.flatMap((locale) => all.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const c = await findProcedure(slug);
  return { title: c ? pick(c.title, locale) : undefined };
}

export default async function ChecklistPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checklists");
  const c = await findProcedure(slug);
  if (!c) notFound();
  const j = JURISDICTIONS.find((x) => x.id === c.jurisdiction);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <Link
        href="/checklists"
        className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink mb-6"
      >
        <ArrowLeft size={14} aria-hidden /> {t("back")}
      </Link>

      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <header className="max-w-[62ch] mb-8">
            <p className="font-mono text-[11px] text-ink-3 tracking-wide mb-2">{j?.short}</p>
            <h1 className="text-[clamp(26px,4vw,36px)] mb-2">{pick(c.title, locale)}</h1>
            <p className="text-ink-2 text-[15.5px]">{pick(c.summary, locale)}</p>
          </header>

          {/* Steps are a real sequence, so they are numbered. */}
          <ol className="relative border-l border-rule ml-3 space-y-8">
            {c.steps.map((s, i) => (
              <li key={i} className="pl-7 relative">
                <span
                  aria-hidden
                  className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full bg-sheet border border-rule-strong font-mono text-[11px] text-ink flex items-center justify-center"
                >
                  {i + 1}
                </span>
                <h2 className="font-sans font-medium text-[16px] text-ink mb-1">
                  {pick(s.title, locale)}
                </h2>
                <p className="text-[14.5px] text-ink-2 max-w-[62ch]">{pick(s.detail, locale)}</p>
                {(s.forms || s.deadline || s.fee) && (
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
                    {s.forms && (
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">{t("forms")}</dt>
                        <FileText size={13} className="text-ink-3" aria-hidden />
                        <dd className="font-mono text-ink">{s.forms.join(", ")}</dd>
                      </div>
                    )}
                    {s.deadline && (
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">{t("deadline")}</dt>
                        <CalendarClock size={13} className="text-seal" aria-hidden />
                        <dd className="text-ink">{pick(s.deadline, locale)}</dd>
                      </div>
                    )}
                    {s.fee && (
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">{t("fee")}</dt>
                        <IndianRupee size={13} className="text-ink-3" aria-hidden />
                        <dd className="text-ink">{pick(s.fee, locale)}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </li>
            ))}
          </ol>
        </div>

        <aside className="lg:sticky lg:top-20 self-start rounded-lg border border-rule bg-sheet p-4 text-[13.5px]">
          <dl className="space-y-4">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-3 mb-1">{t("authority")}</dt>
              <dd className="text-ink">{pick(c.authority, locale)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-3 mb-1">{t("basis")}</dt>
              <dd>
                <ul className="ledger -mx-4 px-4 pt-[6px]">
                  {c.basis.map((b) => (
                    <li key={b} className="ledger-line font-mono text-[12.5px] text-ink">
                      {b}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

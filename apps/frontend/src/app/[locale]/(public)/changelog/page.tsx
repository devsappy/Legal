import { getTranslations, setRequestLocale } from "next-intl/server";
import { pick } from "@sahayak/shared";
import { Badge, PageHeader, type BadgeKind } from "@/components/ui";
import { CHANGELOG, type ChangelogTag } from "@/content/changelog";
import { formatNumber } from "@/lib/format";

/** Monochrome only: "new" is the solid pill, the others hairline and muted. */
const TAG_KIND: Record<ChangelogTag, BadgeKind> = { new: "solid", improved: "neutral", fixed: "soft" };

/** A date-only ISO string formatted in the locale with Latin digits, pinned to UTC so it never slips a day. */
function isoDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelog" });
  return { title: t("title"), description: t("subtitle") };
}

/** What changed, newest first, from content/changelog.ts. Static: no data fetch. */
export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("changelog");
  const tu = await getTranslations("ui.changelog");
  const total = CHANGELOG.length;

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 py-10 sm:px-8 sm:py-14">
      <PageHeader title={t("title")} description={t("subtitle")} eyebrow={t("entries", { count: total, n: formatNumber(total, locale) })} />

      <ol className="mt-10 sm:mt-12">
        {CHANGELOG.map((entry, i) => {
          const last = i === total - 1;
          return (
            <li key={entry.id} id={entry.id} className="relative grid scroll-mt-24 grid-cols-[2rem_minmax(0,1fr)] gap-x-4 sm:gap-x-6">
              {/* Rail: numbered circle, then a hairline down to the next entry */}
              <div className="flex flex-col items-center" aria-hidden>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-rule-strong bg-sheet font-mono text-xs tabular-nums text-ink">
                  {total - i}
                </span>
                {!last && <span className="mt-2 w-px flex-1 bg-rule" />}
              </div>

              <div className={last ? "min-w-0 pb-2 pt-1" : "min-w-0 pb-10 pt-1 sm:pb-12"}>
                <div className="flex flex-wrap items-center gap-2">
                  <time dateTime={entry.date} className="font-mono text-xs tabular-nums text-ink-3">
                    {isoDate(entry.date, locale)}
                  </time>
                  <Badge kind={TAG_KIND[entry.tag]}>{tu(entry.tag)}</Badge>
                  {i === 0 && (
                    <Badge kind="warn" dot>
                      {t("latest")}
                    </Badge>
                  )}
                </div>
                <h2 className="mt-2.5 text-lg font-medium text-ink text-balance">{pick(entry.title, locale)}</h2>
                <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-ink-2">{pick(entry.body, locale)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

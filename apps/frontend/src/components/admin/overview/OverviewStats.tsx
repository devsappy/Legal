import { useLocale, useTranslations } from "next-intl";
import { BookA, FileText, TriangleAlert } from "lucide-react";
import { formatNumber, relativeTime } from "@/lib/format";
import { Stat } from "@/components/ui";

/** Numbers the overview page gathered; `null` means that fetch failed. */
export type OverviewNumbers = {
  open: number | null;
  files: number | null;
  sections: number | null;
  terms: number | null;
  indexed: boolean | null;
  /** ISO string when the backend knows when the index was last written. */
  indexedAt?: string | null;
};

/**
 * Four metric tiles in the hairline grid. A failed fetch renders "—" with
 * a seal warning glyph instead of a fabricated number. Server-safe.
 */
export function OverviewStats({ n }: { n: OverviewNumbers }) {
  const t = useTranslations("admin.overview");
  const locale = useLocale();
  const warn = <TriangleAlert size={14} strokeWidth={1.75} className="text-seal" />;

  const indexValue = n.indexed === null ? "—" : n.indexed ? t("indexCurrent") : t("indexStale");
  const indexSub =
    n.indexed === null
      ? t("unavailable")
      : n.indexedAt
        ? t("lastBuilt", { when: relativeTime(n.indexedAt, locale) })
        : n.indexed
          ? undefined
          : t("notBuilt");

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule-strong bg-rule-strong sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        label={t("openReviews")}
        value={n.open === null ? "—" : formatNumber(n.open, locale)}
        sub={n.open === null ? t("unavailable") : t("openReviewsSub", { count: n.open })}
        icon={n.open === null ? warn : undefined}
        href={n.open === null ? undefined : "/admin/queries?status=open"}
      />
      <Stat
        label={t("corpus")}
        value={n.files === null ? "—" : formatNumber(n.files, locale)}
        sub={n.files === null ? t("unavailable") : t("corpusSub", { files: n.files, sections: n.sections ?? 0 })}
        icon={n.files === null ? warn : <FileText size={14} strokeWidth={1.75} />}
      />
      <Stat
        label={t("glossaryTerms")}
        value={n.terms === null ? "—" : formatNumber(n.terms, locale)}
        sub={n.terms === null ? t("unavailable") : t("glossaryTermsSub", { count: n.terms })}
        icon={n.terms === null ? warn : <BookA size={14} strokeWidth={1.75} />}
      />
      <Stat
        label={t("indexStatus")}
        value={
          <span className="inline-flex items-center gap-2">
            {n.indexed !== null && (
              <span
                aria-hidden
                className={n.indexed ? "size-2 rounded-full bg-ink" : "size-2 rounded-full border border-ink bg-transparent"}
              />
            )}
            <span className={n.indexed === null ? undefined : "text-xl"}>{indexValue}</span>
          </span>
        }
        sub={indexSub}
        icon={n.indexed === null ? warn : undefined}
        href={n.indexed === null ? undefined : "/admin/documents"}
      />
    </div>
  );
}

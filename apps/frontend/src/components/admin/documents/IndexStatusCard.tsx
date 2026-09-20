import { useLocale, useTranslations } from "next-intl";
import { formatDateTime, formatNumber, relativeTime } from "@/lib/format";
import { Badge, Card, Stat, Tooltip } from "@/components/ui";
import { ReindexButton, ReindexJobBar } from "./ReindexButton";

type Props = {
  files: number;
  sections: number;
  untitled: number;
  indexed: boolean;
  /** ISO string of the last index write, when the backend knows it. */
  indexedAt?: string | null;
};

/**
 * The honest state of retrieval: counts, whether the vector index matches
 * the corpus on disk, when it was last built, and the rebuild control with
 * its live job. Server-safe; the button and job bar are client islands.
 */
export function IndexStatusCard({ files, sections, untitled, indexed, indexedAt }: Props) {
  const t = useTranslations("admin.corpus.index");
  const locale = useLocale();

  return (
    <Card padded={false} as="section" className="overflow-hidden">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 id="index-status" className="flex flex-wrap items-center gap-2 text-base font-medium text-ink">
            {indexed ? (
              <Badge kind="solid" dot>
                {t("current")}
              </Badge>
            ) : (
              <Badge kind="warn" dot>
                {t("stale")}
              </Badge>
            )}
            {indexedAt ? (
              <Tooltip content={formatDateTime(indexedAt, locale)}>
                <span className="font-mono text-2xs font-normal text-ink-3" suppressHydrationWarning>
                  {t("lastBuilt", { when: relativeTime(indexedAt, locale) })}
                </span>
              </Tooltip>
            ) : (
              <span className="font-mono text-2xs font-normal text-ink-3">{t("notBuilt")}</span>
            )}
          </h2>
          <p className="mt-1 text-sm text-ink-2">{indexed ? t("currentBody") : t("staleBody")}</p>
        </div>
        <ReindexButton variant={indexed ? "outline" : "primary"} size="sm" className="shrink-0" />
      </div>
      <div className="grid grid-cols-3 gap-px border-t border-rule bg-rule">
        <Stat label={t("files")} value={formatNumber(files, locale)} />
        <Stat label={t("sections")} value={formatNumber(sections, locale)} />
        <Stat label={t("untitled")} value={formatNumber(untitled, locale)} />
      </div>
      <ReindexJobBarSlot />
    </Card>
  );
}

/** Keeps the job bar in its own padded row that collapses to nothing while idle. */
function ReindexJobBarSlot() {
  return (
    <div className="border-t border-rule px-4 py-3 empty:hidden sm:px-5">
      <ReindexJobBar />
    </div>
  );
}

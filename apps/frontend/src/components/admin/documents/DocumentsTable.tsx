"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { JURISDICTIONS, type DocumentRow } from "@sahayak/shared";
import { formatDate, formatNumber, relativeTime } from "@/lib/format";
import { Badge, DataTable, Tooltip, useTableState, type ColumnDef } from "@/components/ui";
import { DocumentDrawer } from "./DocumentDrawer";
import { UploadDialog } from "./UploadDialog";

type Props = {
  rows: DocumentRow[];
};

/**
 * One row per corpus file, grouped under its Act with a file count. Title
 * carries the file path as a mono second line; Updated is relative with
 * the absolute date on hover; Health flags untitled sections. Clicking a
 * row (or Enter) opens the document drawer.
 */
export function DocumentsTable({ rows }: Props) {
  const t = useTranslations("admin.corpus");
  const locale = useLocale();
  const [state, patch] = useTableState({ syncUrl: true });
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const active = activeFile === null ? null : (rows.find((r) => r.file === activeFile) ?? null);

  const groupCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.jurisdiction, (m.get(r.jurisdiction) ?? 0) + 1);
    return m;
  }, [rows]);

  const groupBy = (r: DocumentRow) =>
    t("group", {
      name: JURISDICTIONS.find((j) => j.id === r.jurisdiction)?.act ?? r.jurisdiction,
      count: groupCounts.get(r.jurisdiction) ?? 0,
    });

  const columns = useMemo<ColumnDef<DocumentRow>[]>(
    () => [
      {
        id: "title",
        header: t("columns.title"),
        sortValue: (r) => r.title,
        cell: (r) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-ink">{r.title}</span>
            <span className="truncate font-mono text-2xs text-ink-3">{r.file}</span>
          </span>
        ),
      },
      {
        id: "jurisdiction",
        header: t("columns.jurisdiction"),
        hideBelow: "md",
        cell: (r) => (
          <Badge mono kind="neutral">
            {JURISDICTIONS.find((j) => j.id === r.jurisdiction)?.short ?? r.jurisdiction}
          </Badge>
        ),
      },
      {
        id: "sections",
        header: t("columns.sections"),
        align: "right",
        mono: true,
        width: "110px",
        sortValue: (r) => r.sections,
        cell: (r) => formatNumber(r.sections, locale),
      },
      {
        id: "updated",
        header: t("columns.updated"),
        mono: true,
        width: "140px",
        sortValue: (r) => r.updated,
        cell: (r) =>
          r.updated ? (
            <Tooltip content={formatDate(r.updated, locale, "long")}>
              <time dateTime={r.updated} className="whitespace-nowrap" suppressHydrationWarning>
                {relativeTime(r.updated, locale)}
              </time>
            </Tooltip>
          ) : (
            <span className="text-ink-3">{t("neverUpdated")}</span>
          ),
      },
      {
        id: "health",
        header: t("columns.health"),
        width: "130px",
        sortValue: (r) => r.untitled,
        cell: (r) =>
          r.untitled > 0 ? (
            <Badge kind="warn" dot>
              {t("untitledCount", { count: r.untitled })}
            </Badge>
          ) : (
            <Badge kind="neutral">{t("titled")}</Badge>
          ),
      },
    ],
    [t, locale],
  );

  return (
    <>
      <DataTable
        caption={t("caption")}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.file}
        state={state}
        onStateChange={patch}
        search={{
          placeholder: t("search"),
          test: (r, q) => r.title.toLowerCase().includes(q) || r.file.toLowerCase().includes(q),
        }}
        groupBy={groupBy}
        onRowClick={(r) => setActiveFile(r.file)}
        empty={{
          icon: <FileText size={18} strokeWidth={1.75} />,
          title: t("empty"),
          description: t("emptyBody"),
          action: <UploadDialog size="sm" />,
        }}
      />
      <DocumentDrawer row={active} open={active !== null} onOpenChange={(o) => !o && setActiveFile(null)} />
    </>
  );
}

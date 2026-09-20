import { getTranslations, setRequestLocale } from "next-intl/server";
import { type DocumentRow, JURISDICTIONS } from "@sahayak/shared";
import { backend } from "@/lib/backend";
import { DataTable, StatusPill, type Column } from "@/components/admin/DataTable";
import { DocumentsActions } from "@/components/admin/DocumentsActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("documents") };
}

export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  // One row per corpus file, straight from what the assistant reads.
  const data = await backend<{ rows: DocumentRow[]; sections: number; indexed: boolean }>("/api/admin/documents");
  const rows = data?.rows ?? [];
  const indexed = data?.indexed ?? false;

  const columns: Column<DocumentRow>[] = [
    { key: "title", header: t("columns.title"), render: (r) => <span className="text-ink font-medium">{r.title}</span> },
    { key: "jurisdiction", header: t("columns.jurisdiction"), render: (r) => JURISDICTIONS.find((j) => j.id === r.jurisdiction)?.name ?? r.jurisdiction },
    { key: "file", header: t("columns.version"), render: (r) => r.file, mono: true },
    { key: "updated", header: t("columns.effective"), render: (r) => r.updated, mono: true },
    { key: "sections", header: t("columns.chunks"), render: (r) => r.sections.toLocaleString(locale), mono: true, className: "text-right" },
    {
      key: "status",
      header: t("columns.status"),
      render: (r) =>
        r.untitled ? (
          <StatusPill kind="warn" label={t("untitled", { count: r.untitled })} />
        ) : (
          <StatusPill kind={indexed ? "ok" : "muted"} label={indexed ? t("status.indexed") : t("status.processing")} />
        ),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <p className="text-ink-2 text-[14px] max-w-[60ch]">{t("documentsIntro")}</p>
        <DocumentsActions />
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.file} empty={t("empty")} />
      <p className="mt-3 text-[12.5px] text-ink-3">
        {t("corpusSummary", { sections: data?.sections ?? 0, files: rows.length })} {indexed ? t("indexReady") : t("indexMissing")}
      </p>
    </>
  );
}

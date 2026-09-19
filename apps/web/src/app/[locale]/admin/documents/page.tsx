import { getTranslations, setRequestLocale } from "next-intl/server";
import { RefreshCw, Upload } from "lucide-react";
import { DOCUMENTS, type DocumentRow } from "@/lib/mock-data";
import { JURISDICTIONS } from "@/lib/config";
import { DataTable, StatusPill, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { IndexingIndicator } from "@/components/admin/IndexingIndicator";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("documents") };
}

export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const statusKind: Record<DocumentRow["status"], "ok" | "warn" | "bad" | "muted"> = {
    indexed: "ok",
    processing: "warn",
    failed: "bad",
    superseded: "muted",
  };

  const columns: Column<DocumentRow>[] = [
    { key: "title", header: t("columns.title"), render: (r) => <span className="text-ink font-medium">{r.title}</span> },
    { key: "jurisdiction", header: t("columns.jurisdiction"), render: (r) => JURISDICTIONS.find((j) => j.id === r.jurisdiction)?.name ?? r.jurisdiction },
    { key: "version", header: t("columns.version"), render: (r) => r.version, mono: true },
    { key: "effective", header: t("columns.effective"), render: (r) => r.effective, mono: true },
    { key: "chunks", header: t("columns.chunks"), render: (r) => r.chunks.toLocaleString(locale), mono: true, className: "text-right" },
    {
      key: "status",
      header: t("columns.status"),
      render: (r) =>
        r.status === "processing" ? (
          <IndexingIndicator label={t("processingLabel")} />
        ) : (
          <StatusPill kind={statusKind[r.status]} label={t(`status.${r.status}`)} />
        ),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <p className="text-ink-2 text-[14px] max-w-[60ch]">{t("documentsIntro")}</p>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw size={14} /> {t("reindex")}
          </Button>
          <Button variant="primary">
            <Upload size={14} /> {t("upload")}
          </Button>
        </div>
      </div>
      <DataTable columns={columns} rows={DOCUMENTS} rowKey={(r) => r.id} empty={t("empty")} />
    </>
  );
}

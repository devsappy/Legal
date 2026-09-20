import { promises as fs } from "node:fs";
import path from "node:path";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JURISDICTIONS } from "@/lib/config";
import { loadCorpus } from "@/lib/rag/corpus";
import { hasIndex } from "@/lib/rag/embeddings";
import { DataTable, StatusPill, type Column } from "@/components/admin/DataTable";
import { DocumentsActions } from "@/components/admin/DocumentsActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("documents") };
}

type DocRow = { file: string; title: string; jurisdiction: string; sections: number; updated: string; untitled: number };

export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  // One row per corpus file, straight from what the assistant reads.
  const sections = await loadCorpus();
  const byFile = new Map<string, DocRow>();
  for (const s of sections) {
    const row = byFile.get(s.file) ?? { file: s.file, title: s.act, jurisdiction: s.jurisdiction, sections: 0, updated: "", untitled: 0 };
    row.sections += 1;
    if (!s.title) row.untitled += 1;
    byFile.set(s.file, row);
  }
  const rows = await Promise.all(
    [...byFile.values()].map(async (r) => {
      const st = await fs.stat(path.join(process.cwd(), r.file)).catch(() => null);
      return { ...r, updated: st ? st.mtime.toISOString().slice(0, 10) : "" };
    }),
  );
  rows.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction) || b.sections - a.sections);
  const indexed = await hasIndex(sections);

  const columns: Column<DocRow>[] = [
    { key: "title", header: t("columns.title"), render: (r) => <span className="text-ink font-medium">{r.title}</span> },
    { key: "jurisdiction", header: t("columns.jurisdiction"), render: (r) => JURISDICTIONS.find((j) => j.id === r.jurisdiction)?.name ?? r.jurisdiction },
    { key: "file", header: t("columns.version"), render: (r) => r.file.replace(/\\/g, "/"), mono: true },
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
        {t("corpusSummary", { sections: sections.length, files: rows.length })} {indexed ? t("indexReady") : t("indexMissing")}
      </p>
    </>
  );
}

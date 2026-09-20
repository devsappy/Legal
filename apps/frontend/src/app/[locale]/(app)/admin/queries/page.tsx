import { getTranslations, setRequestLocale } from "next-intl/server";
import { JURISDICTIONS, LANGUAGES, type ReviewRow } from "@sahayak/shared";
import { backend } from "@/lib/backend";
import { DataTable, StatusPill, type Column } from "@/components/admin/DataTable";
import { ReviewActions } from "@/components/admin/ReviewActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("queries") };
}

export default async function QueriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const rows = (await backend<{ rows: ReviewRow[] }>("/api/admin/reviews"))?.rows ?? [];

  const reasonKind: Record<ReviewRow["reason"], "warn" | "bad"> = { low_confidence: "warn", thumbs_down: "bad", no_citation: "bad" };

  const columns: Column<ReviewRow>[] = [
    {
      key: "question",
      header: t("columns.question"),
      render: (r) => (
        <details className="max-w-[40rem]">
          <summary className="text-ink cursor-pointer">{r.question}</summary>
          <p className="mt-2 text-[13px] text-ink-2 whitespace-pre-wrap">{r.answer || "—"}</p>
        </details>
      ),
      className: "min-w-[18rem]",
    },
    { key: "language", header: t("columns.language"), render: (r) => LANGUAGES.find((l) => l.code === r.language)?.native ?? r.language },
    { key: "jurisdiction", header: t("columns.jurisdiction"), render: (r) => JURISDICTIONS.find((j) => j.id === r.jurisdiction)?.short ?? r.jurisdiction, mono: true },
    {
      key: "confidence",
      header: t("columns.confidence"),
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="w-16 h-1.5 rounded-full bg-rule overflow-hidden" aria-hidden>
            <span className={r.confidence < 0.55 ? "block h-full bg-seal" : "block h-full bg-verified"} style={{ width: `${Math.round(r.confidence * 100)}%` }} />
          </span>
          <span className="font-mono text-[12.5px]">{Math.round(r.confidence * 100)}%</span>
        </span>
      ),
    },
    { key: "reason", header: t("columns.reason"), render: (r) => <StatusPill kind={reasonKind[r.reason]} label={t(`reasons.${r.reason}`)} /> },
    {
      key: "asked",
      header: t("columns.asked"),
      render: (r) => new Date(r.created_at + "Z").toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }),
      mono: true,
    },
    { key: "actions", header: "", render: (r) => <ReviewActions id={r.id} status={r.status} />, className: "text-right" },
  ];

  return (
    <>
      <p className="text-ink-2 text-[14px] max-w-[60ch] mb-4">{t("queriesIntro")}</p>
      <DataTable columns={columns} rows={rows} rowKey={(r) => String(r.id)} empty={t("empty")} />
    </>
  );
}

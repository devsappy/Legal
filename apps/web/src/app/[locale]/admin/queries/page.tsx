import { getTranslations, setRequestLocale } from "next-intl/server";
import { QUERIES, type QueryRow } from "@/lib/mock-data";
import { LANGUAGES } from "@/lib/config";
import { DataTable, StatusPill, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("queries") };
}

export default async function QueriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const reasonKind: Record<QueryRow["reason"], "warn" | "bad"> = {
    low_confidence: "warn",
    thumbs_down: "bad",
    no_citation: "bad",
  };

  const columns: Column<QueryRow>[] = [
    { key: "question", header: t("columns.question"), render: (r) => <span className="text-ink">{r.question}</span>, className: "min-w-[18rem]" },
    { key: "language", header: t("columns.language"), render: (r) => LANGUAGES.find((l) => l.code === r.language)?.native ?? r.language },
    {
      key: "confidence",
      header: t("columns.confidence"),
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="w-16 h-1.5 rounded-full bg-rule overflow-hidden" aria-hidden>
            <span
              className={r.confidence < 0.55 ? "block h-full bg-seal" : "block h-full bg-verified"}
              style={{ width: `${Math.round(r.confidence * 100)}%` }}
            />
          </span>
          <span className="font-mono text-[12.5px]">{Math.round(r.confidence * 100)}%</span>
        </span>
      ),
    },
    { key: "reason", header: t("columns.reason"), render: (r) => <StatusPill kind={reasonKind[r.reason]} label={t(`reasons.${r.reason}`)} /> },
    {
      key: "asked",
      header: t("columns.asked"),
      render: (r) => new Date(r.asked).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }),
      mono: true,
    },
    { key: "actions", header: "", render: () => <Button size="sm">{t("review")}</Button>, className: "text-right" },
  ];

  return (
    <>
      <p className="text-ink-2 text-[14px] max-w-[60ch] mb-4">{t("queriesIntro")}</p>
      <DataTable columns={columns} rows={QUERIES} rowKey={(r) => r.id} empty={t("empty")} />
    </>
  );
}

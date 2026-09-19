import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus } from "lucide-react";
import { GLOSSARY, type GlossaryRow } from "@/lib/mock-data";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("glossary") };
}

export default async function GlossaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const columns: Column<GlossaryRow>[] = [
    { key: "term", header: t("columns.term"), render: (r) => <span className="text-ink font-medium">{r.term}</span> },
    { key: "hi", header: "हिन्दी", render: (r) => r.hi },
    { key: "mr", header: "मराठी", render: (r) => r.mr },
    { key: "ta", header: "தமிழ்", render: (r) => r.ta },
    { key: "source", header: t("columns.source"), render: (r) => r.source, mono: true },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <p className="text-ink-2 text-[14px] max-w-[60ch]">{t("glossaryIntro")}</p>
        <Button variant="primary">
          <Plus size={14} /> {t("addTerm")}
        </Button>
      </div>
      <DataTable columns={columns} rows={GLOSSARY} rowKey={(r) => r.term} empty={t("empty")} />
    </>
  );
}

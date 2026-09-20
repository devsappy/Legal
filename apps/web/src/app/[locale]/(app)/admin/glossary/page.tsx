import { getTranslations, setRequestLocale } from "next-intl/server";
import { db, type GlossaryRow } from "@/lib/db";
import { GlossaryEditor } from "@/components/admin/GlossaryEditor";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("glossary") };
}

export default async function GlossaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const rows = db().prepare("SELECT id, term, hi, mr, ta, source FROM glossary ORDER BY term").all() as GlossaryRow[];

  return (
    <>
      <p className="text-ink-2 text-[14px] max-w-[60ch] mb-4">{t("glossaryIntro")}</p>
      <GlossaryEditor rows={rows} />
    </>
  );
}

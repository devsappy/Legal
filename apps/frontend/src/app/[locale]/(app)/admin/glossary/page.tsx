import { getTranslations, setRequestLocale } from "next-intl/server";
import type { GlossaryRow } from "@sahayak/shared";
import { backend } from "@/lib/backend";
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
  const rows = (await backend<{ rows: GlossaryRow[] }>("/api/admin/glossary"))?.rows ?? [];

  return (
    <>
      <p className="text-ink-2 text-[14px] max-w-[60ch] mb-4">{t("glossaryIntro")}</p>
      <GlossaryEditor rows={rows} />
    </>
  );
}

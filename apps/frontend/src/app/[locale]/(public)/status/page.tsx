import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { StatusRefresh } from "@/components/status/StatusRefresh";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "status" });
  return { title: t("title"), description: t("subtitle") };
}

/**
 * Public status page. The server renders only the heading and the
 * "checking" shell; every probe runs in the browser through lib/health.ts,
 * so a slow or down backend never stalls this page and the HTML carries
 * no health data.
 */
export default async function StatusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("status");

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 py-10 sm:px-8 sm:py-14">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <StatusRefresh />
      <p className="mt-5 text-xs text-ink-3">{t("note")}</p>
    </div>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsNav } from "@/components/settings/SettingsNav";

/**
 * Settings frame: the page header with route tabs on phones and tablets,
 * a vertical section list beside the content from lg up.
 */
export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title={t("title")}
        description={t("description")}
        tabs={<SettingsNav variant="tabs" className="lg:hidden" />}
      />
      <div className="mt-6 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        <SettingsNav variant="list" className="hidden lg:block lg:sticky lg:top-6 lg:self-start" />
        <div className="flex min-w-0 max-w-3xl flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}

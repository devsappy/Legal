import { getTranslations, setRequestLocale } from "next-intl/server";
import { PreferencesForm } from "@/components/settings/PreferencesForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: `${t("nav.preferences")} · ${t("title")}` };
}

/** Settings › Preferences: language, Act, appearance, composer and motion — all per device. */
export default async function PreferencesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PreferencesForm />;
}

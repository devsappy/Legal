import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalArticle } from "@/components/legal/LegalArticle";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return { title: t("title") };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalArticle kind="privacy" />;
}

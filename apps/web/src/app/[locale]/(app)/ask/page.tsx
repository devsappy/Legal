import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChatPanel } from "@/components/chat/ChatPanel";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("chat") };
}

export default async function ChatPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ChatPanel />;
}

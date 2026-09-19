import { setRequestLocale } from "next-intl/server";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default async function ChatPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ChatPanel />;
}

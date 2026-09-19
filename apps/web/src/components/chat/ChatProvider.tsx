"use client";

import { createContext, useContext } from "react";
import { useLocale } from "next-intl";
import { useChat } from "@/hooks/useChat";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";

type Chat = ReturnType<typeof useChat>;

const ChatContext = createContext<Chat | null>(null);

/**
 * One chat session for the whole shell: the sidebar starts and reopens
 * conversations, the top bar exports them, the Ask page renders them.
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const { jurisdiction } = useJurisdiction();
  const chat = useChat(locale, jurisdiction);
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside <ChatProvider>");
  return ctx;
}

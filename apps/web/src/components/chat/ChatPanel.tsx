"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { LANGUAGES } from "@/lib/config";
import { useChatContext } from "./ChatProvider";
import { Composer } from "./Composer";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";

export function ChatPanel() {
  const locale = useLocale();
  const chat = useChatContext();
  const [seed, setSeed] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const speechLang = LANGUAGES.find((l) => l.code === locale)?.speech ?? "en-IN";

  // Follow the stream unless the reader has scrolled up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [chat.messages]);

  const empty = chat.messages.length === 0;

  const composer = (
    <Composer
      busy={chat.busy}
      speechLang={speechLang}
      onSend={(text) => {
        setSeed(undefined);
        void chat.send(text);
      }}
      onStop={chat.stop}
      seed={seed}
      autoFocus={empty}
    />
  );

  if (empty) {
    return (
      <div className="flex-1 flex flex-col min-h-0 w-full">
        <EmptyState onPick={(q) => setSeed(`${q}`)} composer={composer} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-thin"
        role="log"
        aria-live="polite"
        aria-busy={chat.busy}
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8 space-y-7 sm:space-y-9">
          {chat.messages.map((m) => (
            <MessageBubble key={m.id} message={m} onFeedback={chat.feedback} onRetry={chat.retry} />
          ))}
        </div>
      </div>

      <div className="shrink-0 bg-gradient-to-t from-sheet via-sheet to-transparent pt-3 pb-2">
        <div className="mx-auto w-full max-w-3xl px-4">{composer}</div>
      </div>
    </div>
  );
}

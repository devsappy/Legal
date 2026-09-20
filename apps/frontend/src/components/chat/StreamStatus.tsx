"use client";

import { useTranslations } from "next-intl";
import type { ChatMessage } from "@/lib/types";

/**
 * The transcript's only live region. It says "Answer ready" once when the
 * latest answer settles (and "failed" / "stopped" likewise), and nothing
 * per token: the log itself carries no aria-live.
 */
export function StreamStatus({ messages }: { messages: ChatMessage[] }) {
  const t = useTranslations("chat");
  const last = messages[messages.length - 1];
  let text = "";
  if (last?.role === "assistant") {
    if (last.status === "done") text = t("answerReady");
    else if (last.status === "error") text = t("answerFailed");
    else if (last.status === "stopped") text = t("answerStopped");
  }
  return (
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {text}
    </p>
  );
}

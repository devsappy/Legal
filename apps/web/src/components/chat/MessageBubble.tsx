"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ThumbsDown, ThumbsUp, RotateCcw } from "lucide-react";
import clsx from "clsx";
import type { ChatMessage } from "@/lib/types";
import { AnswerText } from "./AnswerText";
import { PipelineTrace } from "./PipelineTrace";
import { InlineSources } from "./InlineSources";
import { Button } from "@/components/ui/Button";

type Props = {
  message: ChatMessage;
  onFeedback: (id: string, value: "up" | "down") => void;
  onRetry: () => void;
};

export function MessageBubble({ message, onFeedback, onRetry }: Props) {
  const t = useTranslations("chat");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);

  const isUser = message.role === "user";
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <article className="rise flex flex-col items-end" aria-label={t("you")}>
        <div className="max-w-[92%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-brand-soft text-ink px-4 py-2.5 text-[15px] whitespace-pre-wrap">
          {message.text}
        </div>
        <span className="mt-1 font-mono text-[10.5px] text-ink-3">{time}</span>
      </article>
    );
  }

  const lowConfidence =
    message.status === "done" &&
    message.meta?.confidence !== undefined &&
    message.meta.confidence < 0.55;

  const cite = (id: number) => {
    setSourcesOpen(true);
    setActiveCitation((cur) => (cur === id ? null : id));
  };

  return (
    <article className="rise" aria-label={t("assistant")}>
      <div className="margin-rule pl-4 sm:pl-6">
        <header className="flex items-baseline gap-2 mb-1.5">
          <span className="text-[12.5px] font-medium text-ink-2">{t("assistant")}</span>
          <span className="font-mono text-[10.5px] text-ink-3">{time}</span>
        </header>

        <PipelineTrace message={message} onRetry={onRetry} />

        {message.status === "error" ? (
          <div className="rounded-lg border border-seal/40 bg-seal-soft px-3.5 py-3 text-sm text-ink">
            <p>{t("error")}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>
              <RotateCcw size={13} /> {t("retry")}
            </Button>
          </div>
        ) : message.text === "" ? null : (
          <div className="text-[15px] leading-[1.65] text-ink max-w-[68ch]">
            <AnswerText
              text={message.text}
              streaming={message.status === "streaming"}
              activeCitation={activeCitation}
              onCite={cite}
            />
          </div>
        )}

        {message.status === "done" && (message.meta?.escalate || lowConfidence) && (
          <div
            className={clsx(
              "mt-3 flex gap-2 rounded-lg px-3 py-2 text-[13px] max-w-[68ch]",
              message.meta?.escalate
                ? "bg-seal-soft text-ink border border-seal/30"
                : "bg-brand-soft text-ink border border-brand/30",
            )}
          >
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-seal" aria-hidden />
            <p>{message.meta?.escalate ? t("escalate") : t("lowConfidence")}</p>
          </div>
        )}

        {message.status !== "error" && (
          <div className="max-w-[68ch]">
            <InlineSources
              citations={message.citations}
              open={sourcesOpen}
              onToggle={() => setSourcesOpen((o) => !o)}
              active={activeCitation}
              onSelect={setActiveCitation}
            />
          </div>
        )}

        {message.status === "done" && (
          <footer className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 max-w-[68ch]">
            <span className="stamp">{t("stamp")}</span>
            <div className="flex items-center gap-1 ml-auto">
              {message.feedback ? (
                <span className="text-[12px] text-ink-3">{t("thanks")}</span>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onFeedback(message.id, "up")}
                    aria-label={t("helpful")}
                  >
                    <ThumbsUp size={13} /> <span className="hidden sm:inline">{t("helpful")}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onFeedback(message.id, "down")}
                    aria-label={t("notHelpful")}
                  >
                    <ThumbsDown size={13} />{" "}
                    <span className="hidden sm:inline">{t("notHelpful")}</span>
                  </Button>
                </>
              )}
            </div>
          </footer>
        )}
      </div>
    </article>
  );
}

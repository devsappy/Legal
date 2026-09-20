"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Pencil, RefreshCw } from "lucide-react";
import clsx from "clsx";
import type { ChatMessage } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { AnswerSkeleton } from "./AnswerSkeleton";
import { AnswerText } from "./AnswerText";
import { ErrorCard } from "./ErrorCard";
import { InlineSources } from "./InlineSources";
import { MessageActions } from "./MessageActions";
import { PipelineTrace } from "./PipelineTrace";

type Props = {
  message: ChatMessage;
  /** The newest assistant turn: the only one that can be regenerated. */
  isLatest: boolean;
  busy: boolean;
  showTrace: boolean;
  /** Dimmed while an earlier question is being edited: this turn will be replaced. */
  dimmed?: boolean;
  onFeedback: (id: string, value: "up" | "down", note?: string) => void;
  onRegenerate: (id: string) => void;
  onRetry: () => void;
  onEdit: (id: string) => void;
};

export function MessageBubble({ message, isLatest, busy, showTrace, dimmed, onFeedback, onRegenerate, onRetry, onEdit }: Props) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);

  const isUser = message.role === "user";
  const time = formatTime(message.createdAt, locale);

  if (isUser) {
    return (
      <article
        className={clsx("group rise flex flex-col items-end transition-opacity duration-(--dur-2)", dimmed && "opacity-40")}
        aria-label={t("you")}
        data-motion
      >
        <div className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand-soft px-4 py-2.5 text-base text-ink sm:max-w-[75%]">
          {message.text}
        </div>
        <div className="mt-1 flex h-7 items-center gap-2">
          <Button
            size="xs"
            variant="ghost"
            className={clsx(
              "gap-1 text-ink-3 transition-opacity duration-(--dur-2) motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none",
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100",
            )}
            onClick={() => onEdit(message.id)}
            disabled={busy}
            data-print="hide"
          >
            <Pencil size={12} aria-hidden /> {t("editResend")}
          </Button>
          <span className="font-mono text-2xs text-ink-3">{time}</span>
        </div>
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

  const streaming = message.status === "streaming";
  const stopped = message.status === "stopped";
  const failed = message.status === "error";
  const waiting = streaming && message.text === "";

  return (
    <article className={clsx("group rise transition-opacity duration-(--dur-2)", dimmed && "opacity-40")} aria-label={t("assistant")} data-motion>
      <div className="margin-rule pl-4 sm:pl-6">
        <header className="mb-2 flex items-center gap-2">
          <BrandMark size={20} />
          <span className="text-xs font-medium text-ink-2">{t("assistant")}</span>
          <span className="font-mono text-2xs text-ink-3">{time}</span>
          {stopped && (
            <Badge kind="neutral" mono className="ml-1">
              {t("stopped")}
            </Badge>
          )}
        </header>

        {showTrace && <PipelineTrace message={message} onRetry={onRetry} />}

        {waiting ? (
          <AnswerSkeleton />
        ) : message.text !== "" ? (
          <div className="max-w-[68ch] text-base leading-[1.65] text-ink">
            <AnswerText text={message.text} streaming={streaming} activeCitation={activeCitation} onCite={cite} />
          </div>
        ) : null}

        {failed && <ErrorCard error={message.context?.error} createdAt={message.createdAt} onRetry={onRetry} busy={busy} />}

        {message.status === "done" && (message.meta?.escalate || lowConfidence) && (
          <div
            className={clsx(
              "mt-3 flex max-w-[68ch] gap-2 rounded-lg border px-3 py-2 text-sm text-ink",
              message.meta?.escalate ? "border-seal/30 bg-seal-soft" : "border-rule bg-muted",
            )}
          >
            <AlertTriangle size={15} className={clsx("mt-0.5 shrink-0", message.meta?.escalate ? "text-seal" : "text-ink-2")} aria-hidden />
            <p>{message.meta?.escalate ? t("escalate") : t("lowConfidence")}</p>
          </div>
        )}

        {!failed && (
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

        {stopped && (
          <div className="mt-3 flex flex-wrap items-center gap-2 max-w-[68ch]" data-print="hide">
            <Button size="sm" variant="outline" onClick={() => onRegenerate(message.id)} disabled={busy}>
              <RefreshCw size={13} aria-hidden /> {t("regenerate")}
            </Button>
          </div>
        )}

        {message.status === "done" && (
          <footer className="mt-3 flex min-h-8 max-w-[68ch] flex-wrap items-center gap-x-4 gap-y-2">
            <span className="stamp">{t("stamp")}</span>
            <MessageActions
              className="ml-auto"
              message={message}
              isLatest={isLatest}
              busy={busy}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
            />
          </footer>
        )}
      </div>
    </article>
  );
}

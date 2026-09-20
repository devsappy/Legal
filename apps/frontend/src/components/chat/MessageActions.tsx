"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BookCopy, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { copyText, stripCitations } from "@/lib/clipboard";
import { useSpeakingId } from "@/lib/speech-store";
import { toast } from "@/lib/toast";
import type { ChatMessage } from "@/lib/types";
import { FeedbackNote } from "./FeedbackNote";
import { SpeakButton } from "./SpeakButton";

type Props = {
  message: ChatMessage;
  /** Only the newest answer can be regenerated. */
  isLatest: boolean;
  busy: boolean;
  onFeedback: (id: string, value: "up" | "down", note?: string) => void;
  onRegenerate: (id: string) => void;
  className?: string;
};

/** Plain answer plus a numbered source list, for pasting into a note or an email. */
export function answerWithSources(message: ChatMessage, labels: { sources: string; verified: string; unverified: string }): string {
  const lines = [message.text.trim()];
  if (message.citations.length) {
    lines.push("", `${labels.sources}:`);
    for (const c of message.citations) {
      lines.push(`[${c.id}] ${c.act} ${c.section} — ${c.title} (${c.verified ? labels.verified : labels.unverified})`);
    }
  }
  return lines.join("\n");
}

/**
 * The answer's toolbar: copy, copy with sources, read aloud, regenerate
 * and the thumbs. Revealed on hover or focus, always shown on touch, and
 * kept visible while it holds state (a chosen thumb, an open note, a voice).
 */
export function MessageActions({ message, isLatest, busy, onFeedback, onRegenerate, className }: Props) {
  const t = useTranslations("chat");
  const [noteOpen, setNoteOpen] = useState(false);
  // After a thumb is chosen, "Change" brings both thumbs back for one more pick.
  const [changing, setChanging] = useState(false);
  const speaking = useSpeakingId() === message.id;
  const lang = message.meta?.languageDetected ?? message.context?.language ?? "en";

  const chosen = changing ? undefined : message.feedback;
  const pinned = noteOpen || speaking || chosen !== undefined;

  const copy = async (withSources: boolean) => {
    const text = withSources
      ? answerWithSources(message, { sources: t("sources"), verified: t("verifiedShort"), unverified: t("unverifiedShort") })
      : stripCitations(message.text.trim());
    const ok = await copyText(text);
    if (ok) toast.success(t("copied"));
    else toast.error(t("copyFailed"));
  };

  const vote = (value: "up" | "down", note?: string) => {
    setChanging(false);
    onFeedback(message.id, value, note);
    toast.success(note ? t("noteSent") : t("thanks"));
  };

  // A thumbs-down is recorded when the note closes, with or without text,
  // so dismissing the popover never loses the vote. A ref, because the
  // submit and the close arrive in the same event.
  const noteSubmitted = useRef(false);
  const closeNote = (open: boolean) => {
    if (open) {
      noteSubmitted.current = false;
      setNoteOpen(true);
      return;
    }
    setNoteOpen(false);
    if (!noteSubmitted.current) vote("down");
  };

  const thumb = (value: "up" | "down") => {
    const Icon = value === "up" ? ThumbsUp : ThumbsDown;
    const label = value === "up" ? t("helpful") : t("notHelpful");
    const active = chosen === value;
    return (
      <IconButton
        size="sm"
        label={label}
        aria-pressed={active}
        className={clsx(active && "bg-ink text-paper hover:bg-ink hover:text-paper")}
        onClick={value === "up" ? () => vote("up") : undefined}
      >
        <Icon size={14} aria-hidden />
      </IconButton>
    );
  };

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-0.5 transition-opacity duration-(--dur-2) ease-standard motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none",
        pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100",
        className,
      )}
      role="toolbar"
      aria-label={t("answerActions")}
      data-print="hide"
    >
      <IconButton size="sm" label={t("copy")} onClick={() => void copy(false)}>
        <Copy size={14} aria-hidden />
      </IconButton>
      {message.citations.length > 0 && (
        <IconButton size="sm" label={t("copyWithSources")} onClick={() => void copy(true)}>
          <BookCopy size={14} aria-hidden />
        </IconButton>
      )}
      <SpeakButton id={message.id} text={message.text} lang={lang} />
      {isLatest && (
        <IconButton size="sm" label={t("regenerate")} onClick={() => onRegenerate(message.id)} disabled={busy}>
          <RefreshCw size={14} aria-hidden />
        </IconButton>
      )}

      <span className="mx-1 h-4 w-px bg-rule" aria-hidden />

      {chosen === undefined || chosen === "up" ? thumb("up") : null}
      {chosen === undefined ? (
        <FeedbackNote
          open={noteOpen}
          onOpenChange={closeNote}
          onSubmit={(note) => {
            noteSubmitted.current = true;
            vote("down", note);
          }}
          trigger={
            <button
              type="button"
              aria-label={t("notHelpful")}
              title={t("notHelpful")}
              className="relative inline-flex h-8 w-8 items-center justify-center gap-1.5 rounded-md text-ink-2 transition-colors hover:bg-muted hover:text-ink active:translate-y-px aria-expanded:bg-muted aria-expanded:text-ink"
            >
              <ThumbsDown size={14} aria-hidden />
            </button>
          }
        />
      ) : chosen === "down" ? (
        thumb("down")
      ) : null}
      {chosen !== undefined && (
        <Button size="xs" variant="link" className="ml-1 text-xs text-ink-2" onClick={() => setChanging(true)}>
          {t("changeFeedback")}
        </Button>
      )}
    </div>
  );
}

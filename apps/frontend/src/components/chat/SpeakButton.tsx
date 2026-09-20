"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Square, Volume2 } from "lucide-react";
import clsx from "clsx";
import { IconButton } from "@/components/ui/IconButton";
import { getSpeakingId, stopSpeaking, toggleSpeech, useSpeakingId, useSpeechSupported } from "@/lib/speech-store";

type Props = {
  /** The message id; only the button whose id is playing shows "Stop reading". */
  id: string;
  text: string;
  lang: string;
  className?: string;
};

/**
 * Reads an answer aloud with the browser's speech synthesis through the
 * shared speech store, so starting one answer stops another. Picks a voice
 * for the answer's language when the OS has one; otherwise the default
 * voice speaks it. Hidden entirely where the API is missing.
 */
export function SpeakButton({ id, text, lang, className }: Props) {
  const t = useTranslations("chat");
  const supported = useSpeechSupported();
  const speaking = useSpeakingId() === id;

  // Leaving the transcript mid-sentence should not keep talking.
  useEffect(
    () => () => {
      if (getSpeakingId() === id) stopSpeaking();
    },
    [id],
  );

  if (!supported) return null;

  return (
    <IconButton
      size="sm"
      label={speaking ? t("stopSpeaking") : t("speak")}
      aria-pressed={speaking}
      onClick={() => toggleSpeech(id, text, lang)}
      className={clsx(speaking && "bg-muted text-ink", className)}
    >
      {speaking ? <Square size={14} aria-hidden /> : <Volume2 size={15} aria-hidden />}
    </IconButton>
  );
}

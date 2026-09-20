"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Reads an answer aloud with the browser's speech synthesis. Picks a voice
 * for the answer's language when the OS has one; otherwise the default
 * voice speaks it, which is still useful for English and Hindi on most
 * systems. Hidden entirely where the API is missing.
 */
export function SpeakButton({ text, lang }: { text: string; lang: string }) {
  const t = useTranslations("chat");
  const [speaking, setSpeaking] = useState(false);
  // Server renders nothing; the client decides once it knows the browser.
  const supported = useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false,
  );

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!supported) return null;

  const bcp47: Record<string, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", ta: "ta-IN" };

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    // Strip citation markers so "[2]" is not read out.
    const u = new SpeechSynthesisUtterance(text.replace(/\[\d+\]/g, ""));
    const want = bcp47[lang] ?? "en-IN";
    const voice = synth.getVoices().find((v) => v.lang === want) ?? synth.getVoices().find((v) => v.lang.startsWith(want.slice(0, 2)));
    if (voice) u.voice = voice;
    u.lang = want;
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  };

  return (
    <Button size="sm" variant="ghost" onClick={toggle} aria-label={speaking ? t("stopSpeaking") : t("speak")} title={speaking ? t("stopSpeaking") : t("speak")}>
      {speaking ? <Square size={13} /> : <Volume2 size={13} />}
      <span className="hidden sm:inline">{speaking ? t("stopSpeaking") : t("speak")}</span>
    </Button>
  );
}

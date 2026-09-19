"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp, Square } from "lucide-react";
import clsx from "clsx";
import { useSpeech } from "@/hooks/useSpeech";
import { useToken } from "@/hooks/useToken";
import { LatticeLoader, VoicePill } from "@/components/reactbits";

type Props = {
  busy: boolean;
  speechLang: string;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Externally injected text, e.g. from an example question. */
  seed?: string;
  /** Focus the field on mount (hero placement). */
  autoFocus?: boolean;
  className?: string;
};

export function Composer({ busy, speechLang, onSend, onStop, seed, autoFocus, className }: Props) {
  const t = useTranslations("chat");
  const [value, setValue] = useState("");
  const [interim, setInterim] = useState("");
  const [stopKey, setStopKey] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  // The pill paints its waveform on a canvas, so it needs resolved colours.
  const brand = useToken("--brand", "#6d4ff0");
  const inkSoft = useToken("--ink-2", "#4a4a58");
  const muted = useToken("--muted", "#f1f1f8");

  const speech = useSpeech(
    speechLang,
    (text, final) => {
      if (final) {
        setValue((v) => (v ? `${v} ${text}` : text));
        setInterim("");
      } else {
        setInterim(text);
      }
    },
    // Recogniser ended on its own (error, permission, network): fold the pill.
    () => setStopKey((k) => k + 1),
  );

  // Adopt a new seed (example question) as the draft
  const [prevSeed, setPrevSeed] = useState(seed);
  if (seed !== prevSeed) {
    setPrevSeed(seed);
    if (seed) setValue(seed);
  }
  useEffect(() => {
    if (seed || autoFocus) ref.current?.focus();
  }, [seed, autoFocus]);

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value, interim]);

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
    setInterim("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={clsx(
        "relative z-10 rounded-2xl border bg-sheet transition-[border-color,box-shadow]",
        "shadow-[0_1px_2px_rgba(9,9,11,0.04),0_16px_48px_-24px_color-mix(in_srgb,var(--brand)_45%,transparent)]",
        speech.listening
          ? "border-brand/60"
          : "border-rule focus-within:border-brand/50 focus-within:shadow-[0_1px_2px_rgba(9,9,11,0.04),0_20px_56px_-24px_color-mix(in_srgb,var(--brand)_60%,transparent)]",
        className,
      )}
    >
      <label htmlFor="composer" className="sr-only">
        {t("placeholder")}
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={interim ? `${value}${value ? " " : ""}${interim}` : value}
        onChange={(e) => {
          setInterim("");
          setValue(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={speech.listening ? t("listening") : t("placeholder")}
        className="focus-quiet block w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] text-ink placeholder:text-ink-3 min-h-[52px] max-h-[180px] scroll-thin"
      />

      <div className="flex items-center gap-2 px-2.5 pb-2.5 pt-1">
        {/* Tap to latch, hold to talk, slide left to cancel. Speech recognition
            owns the microphone; the pill's level is simulated. */}
        <div
          className="flex items-center h-9"
          title={speech.supported ? t("voice") : t("voiceUnsupported")}
        >
          <VoicePill
            size={32}
            shape="pill"
            mode="auto"
            reactive="simulated"
            accentColor={brand}
            iconColor={inkSoft}
            background={muted}
            disabled={!speech.supported || busy}
            ariaLabel={t("voice")}
            stopKey={stopKey}
            onStart={() => speech.start()}
            onStop={({ reason }) => {
              if (reason === "cancel") {
                speech.cancel();
                setInterim("");
              } else if (reason !== "external") {
                speech.stop();
              }
            }}
          />
        </div>
        {/* While the answer streams the hint gives way to the lattice and its stopwatch. */}
        {busy ? (
          <LatticeLoader
            status="working"
            label={t("thinking")}
            pattern="orbit"
            grid={3}
            shape="round"
            cellSize={4}
            gap={2}
            fontSize={12}
            color="var(--brand)"
            glow
            showTimer
          />
        ) : (
          <span className="hidden sm:inline text-[11.5px] text-ink-3 select-none">{t("hint")}</span>
        )}

        <div className="ml-auto">
          {busy ? (
            <button
              type="button"
              onClick={onStop}
              aria-label={t("stop")}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-rule bg-sheet text-ink hover:bg-muted transition-colors"
            >
              <Square size={13} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!value.trim()}
              aria-label={t("send")}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-[0_2px_8px_-2px_var(--brand)]"
            >
              <ArrowUp size={17} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

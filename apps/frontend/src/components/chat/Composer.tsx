"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp, MicOff, Square, X } from "lucide-react";
import clsx from "clsx";
import { useHotkey } from "@/hooks/useHotkey";
import { useHydrated } from "@/hooks/useHydrated";
import { useIsMac } from "@/hooks/useIsMac";
import { usePersisted } from "@/hooks/usePersisted";
import { useSpeech, type SpeechErrorKind } from "@/hooks/useSpeech";
import { useToken } from "@/hooks/useToken";
import { usePrefs } from "@/lib/prefs";
import { registerShortcut } from "@/lib/shortcuts";
import { toast } from "@/lib/toast";
import { LatticeLoader, VoicePill } from "@/components/reactbits";
import { Tooltip } from "@/components/ui/Tooltip";
import { ContextChips } from "./ContextChips";

type Props = {
  busy: boolean;
  speechLang: string;
  /** The conversation the draft belongs to; "" before the first question. */
  sessionId: string;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Externally injected text: an example question, ?q=, an edited turn. A new key adopts the text again. */
  seed?: ComposerSeed;
  /** Focus the field on mount (hero placement). */
  autoFocus?: boolean;
  className?: string;
};

export type ComposerSeed = { text: string; key: number };

/** Characters past which the counter appears. */
const COUNT_FROM = 1000;
const MAX_HEIGHT = 180;

/* ---- unsent text survives a reload, per conversation, in this tab ---- */
function draftKey(sessionId: string) {
  return `coop.draft.${sessionId || "new"}`;
}
function readDraft(key: string): string {
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}
function writeDraft(key: string, value: string) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

export function Composer({ busy, speechLang, sessionId, onSend, onStop, seed, autoFocus, className }: Props) {
  const t = useTranslations("chat");
  const prefs = usePrefs();
  const isMac = useIsMac();
  const hydrated = useHydrated();
  const ref = useRef<HTMLTextAreaElement>(null);

  const [value, setValue] = useState(seed?.text ?? "");
  const [interim, setInterim] = useState("");
  const [stopKey, setStopKey] = useState(0);
  const [voiceNoteOpen, setVoiceNoteOpen] = useState(false);
  const [voiceNoteSeen, setVoiceNoteSeen] = usePersisted<boolean>("coop.voice.noteSeen", false);

  const key = draftKey(sessionId);
  const update = (next: string) => {
    setValue(next);
    writeDraft(key, next);
  };

  // Adopt the stored draft once hydrated (sessionStorage is not on the
  // server), and again whenever the conversation changes under the field.
  const [draftFor, setDraftFor] = useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
  if (hydrated && draftFor !== key) {
    setDraftFor(key);
    const stored = readDraft(key);
    if (draftFor === null) {
      if (stored && !value.trim()) {
        setValue(stored);
        setRestoredDraft(true);
      }
    } else {
      setValue(stored);
    }
  }
  const restoreToasted = useRef(false);
  useEffect(() => {
    if (!restoredDraft || restoreToasted.current) return;
    restoreToasted.current = true;
    toast.info(t("draftRestored"));
  }, [restoredDraft, t]);

  // Adopt a new seed (example question, ?q=, an edited turn) as the draft.
  const seedKey = seed?.key;
  const [prevSeedKey, setPrevSeedKey] = useState(seedKey);
  if (seedKey !== prevSeedKey) {
    setPrevSeedKey(seedKey);
    if (seed) setValue(seed.text);
  }
  useEffect(() => {
    if (seedKey === undefined && !autoFocus) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (seedKey !== undefined) el.setSelectionRange(el.value.length, el.value.length);
  }, [seedKey, autoFocus]);

  // The pill paints its waveform on a canvas, so it needs resolved colours.
  const ink = useToken("--ink", "#09090b");
  const inkSoft = useToken("--ink-2", "#3f3f46");
  const muted = useToken("--muted", "#f4f4f5");

  const onVoiceEnd = (error?: SpeechErrorKind) => {
    // Recogniser ended on its own: fold the pill, and say why when it matters.
    setStopKey((k) => k + 1);
    if (error === "not-allowed") toast.error(t("voiceDenied"));
    else if (error === "no-speech") toast.error(t("voiceNoSpeech"));
    else if (error === "audio-capture") toast.error(t("voiceNoMic"));
    else if (error === "network") toast.error(t("voiceNetwork"));
  };
  const speech = useSpeech(
    speechLang,
    (text, final) => {
      if (final) {
        setValue((v) => {
          const next = v ? `${v} ${text}` : text;
          writeDraft(key, next);
          return next;
        });
        setInterim("");
      } else {
        setInterim(text);
      }
    },
    onVoiceEnd,
  );

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value, interim]);

  // Keyboard: mod+/ brings focus here from anywhere; Escape (while the field
  // has focus) stops a streaming answer. Escape is bound on the field itself
  // so a dialog's own Escape is never swallowed.
  useHotkey("mod+/", () => ref.current?.focus(), {
    id: "chat.focus",
    scope: "chat",
    label: t("focusComposer"),
    allowInInputs: true,
  });
  const stopLabel = t("escapeStops");
  useEffect(() => registerShortcut({ id: "chat.stop", combo: "escape", scope: "chat", label: stopLabel }), [stopLabel]);

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
    setInterim("");
    writeDraft(key, "");
  };

  const shown = interim ? `${value}${value ? " " : ""}${interim}` : value;
  const count = value.length;
  const mod = isMac ? "⌘" : "Ctrl";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={clsx(
        "relative z-10 rounded-2xl border bg-sheet shadow-raised transition-[border-color,box-shadow] duration-(--dur-2)",
        speech.listening ? "border-ink" : "border-rule focus-within:border-rule-strong focus-within:shadow-popover",
        className,
      )}
    >
      {/* Which Act and language the answer will use, right where the question is typed. */}
      <div className="flex items-center gap-2 px-3 pt-2.5">
        <ContextChips />
      </div>

      <label htmlFor="composer" className="sr-only">
        {t("placeholder")}
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={shown}
        onChange={(e) => {
          setInterim("");
          update(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Escape" && busy) {
            e.preventDefault();
            onStop();
            return;
          }
          if (e.key !== "Enter") return;
          const withMod = e.metaKey || e.ctrlKey;
          if (withMod || (prefs.enterSends && !e.shiftKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={speech.listening ? t("listening") : t("placeholder")}
        aria-describedby="composer-hint"
        className="focus-quiet scroll-thin block min-h-[52px] max-h-[180px] w-full resize-none bg-transparent px-4 pb-1 pt-2.5 text-base text-ink placeholder:text-ink-3"
      />

      {voiceNoteOpen && (
        <p className="mx-3 mb-1 flex items-start gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs text-ink-2" data-motion>
          <MicOff size={13} className="mt-0.5 shrink-0" aria-hidden />
          <span className="flex-1">{t("voiceNeedsChrome")}</span>
          <button
            type="button"
            onClick={() => {
              setVoiceNoteOpen(false);
              setVoiceNoteSeen(true);
            }}
            aria-label={t("dismissNote")}
            className="-mr-1 rounded-sm p-0.5 text-ink-3 hover:text-ink"
          >
            <X size={13} aria-hidden />
          </button>
        </p>
      )}

      {/* Bottom row keeps one height whether it shows the hint, the counter or the lattice. */}
      <div className="flex h-12 items-center gap-2 px-2.5 pb-1">
        <div className="flex h-9 shrink-0 items-center">
          {speech.supported ? (
            /* Tap to latch, hold to talk, slide left to cancel. Speech recognition
               owns the microphone; the pill's level is simulated. */
            <VoicePill
              size={32}
              shape="pill"
              mode="auto"
              reactive="simulated"
              accentColor={ink}
              iconColor={inkSoft}
              background={muted}
              disabled={busy}
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
          ) : (
            <Tooltip content={t("voiceUnsupported")}>
              <button
                type="button"
                aria-label={t("voiceUnsupported")}
                aria-disabled="true"
                onClick={() => {
                  if (!voiceNoteSeen) setVoiceNoteOpen(true);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-ink-3"
              >
                <MicOff size={15} aria-hidden />
              </button>
            </Tooltip>
          )}
        </div>

        <div id="composer-hint" className="flex h-9 min-w-0 flex-1 items-center overflow-hidden">
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
              color="var(--ink)"
              showTimer
            />
          ) : count > COUNT_FROM ? (
            <span className="font-mono text-2xs tabular-nums text-ink-3">{t("charCount", { count })}</span>
          ) : (
            <span className="hidden select-none text-2xs text-ink-3 sm:inline">
              {prefs.enterSends ? t("hint") : t("hintMod", { mod })}
            </span>
          )}
        </div>

        <div className="ml-auto shrink-0">
          {busy ? (
            <Tooltip content={t("stop")}>
              <button
                type="button"
                onClick={onStop}
                aria-label={t("stop")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule bg-sheet text-ink transition-colors hover:border-rule-strong hover:bg-muted active:translate-y-px"
              >
                <Square size={13} aria-hidden />
              </button>
            </Tooltip>
          ) : (
            <Tooltip content={t("send")}>
              <button
                type="submit"
                disabled={!value.trim()}
                aria-label={t("send")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-raised transition-colors hover:bg-primary/90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp size={17} strokeWidth={2.5} aria-hidden />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </form>
  );
}

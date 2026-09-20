"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* Minimal typings for the Web Speech API (not in lib.dom for all targets) */
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error?: string };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

/**
 * Why listening ended on its own. "not-allowed" is a denied microphone
 * permission, "no-speech" a silent take, "network" the recogniser's own
 * service being unreachable (Chrome sends audio to Google), "other" the rest.
 */
export type SpeechErrorKind = "not-allowed" | "no-speech" | "audio-capture" | "network" | "aborted" | "other";

function toKind(error: string | undefined): SpeechErrorKind {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "not-allowed";
    case "no-speech":
      return "no-speech";
    case "audio-capture":
      return "audio-capture";
    case "network":
      return "network";
    case "aborted":
      return "aborted";
    default:
      return "other";
  }
}

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Browser speech-to-text. Chrome/Edge support Indian English, Hindi, Marathi and Tamil.
 * The backend's Whisper path replaces this for WhatsApp / low-end devices.
 *
 * `onEnd` fires whenever the recogniser stops by itself, with the error
 * kind when there was one, so the composer can fold its pill and say why.
 */
export function useSpeech(
  lang: string,
  onTranscript: (text: string, final: boolean) => void,
  onEnd?: (error?: SpeechErrorKind) => void,
) {
  const supported = useSyncExternalStore(
    () => () => undefined,
    () => getCtor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const cbRef = useRef(onTranscript);
  const endRef = useRef(onEnd);
  const cancelledRef = useRef(false);
  // The error event arrives before `end`; remember it so `end` reports once with the reason.
  const errorRef = useRef<SpeechErrorKind | undefined>(undefined);

  useEffect(() => {
    cbRef.current = onTranscript;
    endRef.current = onEnd;
  }, [onTranscript, onEnd]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  /** Stop and discard whatever was heard. */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    recRef.current?.abort();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    recRef.current?.abort();

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    // Keep listening until the pill is released; silence alone does not end it.
    rec.continuous = true;
    cancelledRef.current = false;
    errorRef.current = undefined;
    rec.onresult = (e) => {
      if (cancelledRef.current) return;
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (final) cbRef.current(final, true);
      else if (interim) cbRef.current(interim, false);
    };
    rec.onerror = (e) => {
      errorRef.current = toKind(e?.error);
    };
    rec.onend = () => {
      setListening(false);
      const error = errorRef.current;
      errorRef.current = undefined;
      // A cancel from our side is not worth reporting.
      endRef.current?.(cancelledRef.current || error === "aborted" ? undefined : error);
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      endRef.current?.("other");
    }
  }, [lang]);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, start, stop, cancel };
}

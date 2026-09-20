"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* Minimal typings for the Web Speech API (not in lib.dom for all targets) */
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Browser speech-to-text. Chrome/Edge support Indian English, Hindi, Marathi and Tamil.
 * The backend's Whisper path replaces this for WhatsApp / low-end devices.
 */
export function useSpeech(
  lang: string,
  onTranscript: (text: string, final: boolean) => void,
  onEnd?: () => void,
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
    rec.onend = () => {
      setListening(false);
      endRef.current?.();
    };
    rec.onerror = () => {
      setListening(false);
      endRef.current?.();
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [lang]);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, start, stop, cancel };
}

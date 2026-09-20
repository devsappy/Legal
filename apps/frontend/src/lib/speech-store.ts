"use client";

import { useSyncExternalStore } from "react";
import { stripCitations } from "./clipboard";

/**
 * One voice for the whole page. Every SpeakButton reads the same store, so
 * starting one answer stops another and only one button ever says
 * "Stop reading". The auto-read preference speaks through here as well.
 */
type State = { id: string | null };

const IDLE: State = { id: null };
let state: State = IDLE;
const listeners = new Set<() => void>();
let seq = 0;

const BCP47: Record<string, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", ta: "ta-IN" };

function emit() {
  for (const cb of listeners) cb();
}

function set(next: State) {
  state = next;
  emit();
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/** Reads `text` aloud as `id`; a second call replaces whatever was playing. */
export function speak(id: string, text: string, lang: string): void {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const token = ++seq;
  const u = new SpeechSynthesisUtterance(stripCitations(text));
  const want = BCP47[lang] ?? BCP47[lang.slice(0, 2)] ?? "en-IN";
  const voices = synth.getVoices();
  const voice = voices.find((v) => v.lang === want) ?? voices.find((v) => v.lang.startsWith(want.slice(0, 2)));
  if (voice) u.voice = voice;
  u.lang = want;
  u.rate = 0.95;
  const settle = () => {
    // A newer utterance may already own the store; only the current one clears it.
    if (seq === token) set(IDLE);
  };
  u.onend = settle;
  u.onerror = settle;
  set({ id });
  synth.speak(u);
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
  seq += 1;
  if (state.id !== null) set(IDLE);
}

/** Toggle helper for buttons: stops when `id` is playing, otherwise speaks it. */
export function toggleSpeech(id: string, text: string, lang: string): void {
  if (state.id === id) stopSpeaking();
  else speak(id, text, lang);
}

export function getSpeakingId(): string | null {
  return state.id;
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const none = () => null;

/** Which message is being read right now; null on the server. */
export function useSpeakingId(): string | null {
  return useSyncExternalStore(subscribe, getSpeakingId, none);
}

const noop = () => () => {};
const no = () => false;

/** False on the server, so the button appears only once the browser is known. */
export function useSpeechSupported(): boolean {
  return useSyncExternalStore(noop, isSpeechSupported, no);
}

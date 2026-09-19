"use client";

import { useSyncExternalStore } from "react";
import type { ChatMessage } from "./types";

/**
 * Past conversations, kept in localStorage so the sidebar can list and
 * reopen them. Same external-store pattern as the jurisdiction provider.
 */
export type Conversation = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
};

const KEY = "coop.history";
const EVENT = "coop:history";
const LIMIT = 50;
const EMPTY: Conversation[] = [];

let cacheRaw: string | null = null;
let cacheList: Conversation[] = EMPTY;

function read(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cacheRaw) return cacheList;
    cacheRaw = raw;
    cacheList = raw ? (JSON.parse(raw) as Conversation[]) : EMPTY;
  } catch {
    cacheRaw = null;
    cacheList = EMPTY;
  }
  return cacheList;
}

function write(list: Conversation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable or full */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function saveConversation(c: Conversation) {
  const rest = read().filter((x) => x.id !== c.id);
  write([c, ...rest].slice(0, LIMIT));
}

export function removeConversation(id: string) {
  write(read().filter((x) => x.id !== id));
}

export function getConversation(id: string) {
  return read().find((x) => x.id === id);
}

/** Newest first. Server snapshot is empty; the client fills it in after hydration. */
export function useHistory(): Conversation[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Buckets for the sidebar: today, yesterday, the last week, everything else. */
export type HistoryBucket = "today" | "yesterday" | "week" | "older";

export function bucketOf(ts: number, now = Date.now()): HistoryBucket {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const day = 86_400_000;
  if (ts >= startOfToday) return "today";
  if (ts >= startOfToday - day) return "yesterday";
  if (ts >= startOfToday - 7 * day) return "week";
  return "older";
}

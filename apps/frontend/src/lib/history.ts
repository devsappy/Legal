"use client";

import { useSyncExternalStore } from "react";
import type { ChatMessage } from "./types";

/**
 * Past conversations, kept in localStorage so the sidebar can list and
 * reopen them. Same external-store pattern as the jurisdiction provider.
 *
 * The signed-in user's copy on the server is kept in sync best-effort:
 * every save is PUT, the list is re-pulled on focus and when the browser
 * comes back online, and a small sync store (useSyncState) reports what
 * the last push did so the shell can show "Saving… / Saved / Offline".
 */
export type Conversation = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
};

const KEY = "coop.history";
/** Titles the user set by hand, by id; they win over the title derived from the first question. */
const TITLES_KEY = "coop.history.titles";
const EVENT = "coop:history";
export const LIMIT = 100;
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

/* ---- custom titles ------------------------------------------------------ */

function readTitles(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TITLES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeTitles(titles: Record<string, string>) {
  try {
    if (Object.keys(titles).length === 0) localStorage.removeItem(TITLES_KEY);
    else localStorage.setItem(TITLES_KEY, JSON.stringify(titles));
  } catch {
    /* storage unavailable or full */
  }
}

/** The conversation with the user's own title applied, when there is one. */
function withTitle(c: Conversation, titles = readTitles()): Conversation {
  const custom = titles[c.id];
  return custom && custom !== c.title ? { ...c, title: custom } : c;
}

/* ---- listeners: focus / online re-sync is wired with the first subscriber ---- */

const MIN_SYNC_GAP = 5_000;
let subscribers = 0;
let wired = false;
let lastSyncAt = 0;

function syncIfStale() {
  if (Date.now() - lastSyncAt < MIN_SYNC_GAP) return;
  void syncFromServer();
}

function onOnline() {
  if (failed.size) retrySync();
  else setSync(syncState.lastSavedAt ? "saved" : "idle");
  syncIfStale();
}

function onOffline() {
  setSync("offline");
}

function wire() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("focus", syncIfStale);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  if (!navigator.onLine) setSync("offline");
}

function unwire() {
  if (!wired || subscribers > 0 || syncListeners.size > 0) return;
  wired = false;
  window.removeEventListener("focus", syncIfStale);
  window.removeEventListener("online", onOnline);
  window.removeEventListener("offline", onOffline);
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  subscribers += 1;
  wire();
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
    subscribers -= 1;
    unwire();
  };
}

export function saveConversation(c: Conversation) {
  const next = withTitle(c);
  const rest = read().filter((x) => x.id !== next.id);
  write([next, ...rest].slice(0, LIMIT));
}

export function removeConversation(id: string) {
  write(read().filter((x) => x.id !== id));
}

export function clearHistory() {
  writeTitles({});
  write([]);
}

/**
 * Gives a conversation a title of the user's choosing. It sticks: later
 * saves from the chat hook (which derive the title from the first question)
 * and later pulls from the server keep it. Empty titles are ignored.
 */
export function renameConversation(id: string, title: string) {
  const clean = title.replace(/\s+/g, " ").trim().slice(0, 96);
  if (!clean) return;
  const titles = readTitles();
  titles[id] = clean;
  writeTitles(titles);
  const current = read().find((x) => x.id === id);
  if (!current) return;
  const updated = { ...current, title: clean };
  write(read().map((x) => (x.id === id ? updated : x)));
  pushToServer(updated);
}

/* ---- deferred deletes (undo window) ------------------------------------ */

const pendingDeletes = new Set<string>();
let pagehideWired = false;

/** Whatever is still waiting when the tab goes away is deleted with keepalive. */
function flushPendingDeletes() {
  for (const id of pendingDeletes) deleteOnServer(id);
  pendingDeletes.clear();
}

/**
 * Marks a conversation as deleted-pending-undo: the server copy is kept
 * until commitDelete() (the undo toast closing) or the page hides, and
 * syncFromServer() will not resurrect it in the meantime.
 */
export function scheduleDelete(id: string) {
  pendingDeletes.add(id);
  if (!pagehideWired && typeof window !== "undefined") {
    pagehideWired = true;
    window.addEventListener("pagehide", flushPendingDeletes);
  }
}

/** The user pressed Undo: keep the server copy. */
export function cancelDelete(id: string) {
  pendingDeletes.delete(id);
}

/** The undo window closed: delete for real. */
export function commitDelete(id: string) {
  pendingDeletes.delete(id);
  const titles = readTitles();
  if (id in titles) {
    delete titles[id];
    writeTitles(titles);
  }
  deleteOnServer(id);
}

export function isDeletePending(id: string): boolean {
  return pendingDeletes.has(id);
}

/* ---- server copy: the signed-in user's conversations, kept in sync best-effort ---- */

/** Pull the server's list and merge it in, newer revision wins per id. */
export async function syncFromServer() {
  lastSyncAt = Date.now();
  try {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const data = (await res.json()) as { conversations?: Conversation[] };
    const titles = readTitles();
    const local = new Map(read().map((c) => [c.id, c]));
    for (const c of data.conversations ?? []) {
      if (pendingDeletes.has(c.id)) continue;
      const mine = local.get(c.id);
      if (!mine || mine.updatedAt < c.updatedAt) local.set(c.id, withTitle(c, titles));
    }
    write([...local.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, LIMIT));
  } catch {
    /* offline or signed out */
  }
}

/* ---- sync state: what the last push did ---------------------------------- */

export type SyncStatus = "idle" | "saving" | "saved" | "error" | "offline";

export type SyncState = {
  status: SyncStatus;
  /** When the server last confirmed a save, or null before the first one. */
  lastSavedAt: number | null;
};

const SYNC_INITIAL: SyncState = { status: "idle", lastSavedAt: null };
let syncState: SyncState = SYNC_INITIAL;
const syncListeners = new Set<() => void>();
let inflight = 0;
/** Conversations whose last push failed, re-sent by retrySync(). */
const failed = new Map<string, Conversation>();

function setSync(status: SyncStatus, lastSavedAt = syncState.lastSavedAt) {
  if (syncState.status === status && syncState.lastSavedAt === lastSavedAt) return;
  syncState = { status, lastSavedAt };
  for (const cb of syncListeners) cb();
}

function subscribeSync(cb: () => void) {
  syncListeners.add(cb);
  wire();
  return () => {
    syncListeners.delete(cb);
    unwire();
  };
}

export function getSyncState(): SyncState {
  return syncState;
}

/** Live "Saving… / Saved / Offline" state for the shell. Server snapshot is idle. */
export function useSyncState(): SyncState {
  return useSyncExternalStore(subscribeSync, getSyncState, () => SYNC_INITIAL);
}

/** Re-sends every conversation whose last push failed. */
export function retrySync() {
  const again = [...failed.values()];
  failed.clear();
  for (const c of again) pushToServer(c);
}

export function pushToServer(c: Conversation) {
  const conv = withTitle(c);
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    failed.set(conv.id, conv);
    setSync("offline");
    return;
  }
  inflight += 1;
  setSync("saving");
  fetch("/api/conversations", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: conv.id, title: conv.title, messages: conv.messages }),
  })
    .then((res) => {
      if (res.ok) {
        failed.delete(conv.id);
        if (inflight === 1) setSync("saved", Date.now());
      } else {
        failed.set(conv.id, conv);
        if (inflight === 1) setSync("error");
      }
    })
    .catch(() => {
      failed.set(conv.id, conv);
      if (inflight === 1) setSync(navigator.onLine ? "error" : "offline");
    })
    .finally(() => {
      inflight -= 1;
    });
}

export function deleteOnServer(id: string) {
  // keepalive lets the request finish when it is fired from pagehide.
  fetch(`/api/conversations?id=${encodeURIComponent(id)}`, { method: "DELETE", keepalive: true }).catch(
    () => undefined,
  );
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

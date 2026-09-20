"use client";

import { useSyncExternalStore } from "react";
import { API_URL } from "./config";

/**
 * The one reader of /api/health. Polls every minute while the tab is
 * visible, re-checks when the window regains focus or comes back online,
 * and shares the result with every subscriber (status dot, status page,
 * admin overview). Nothing else in the app should fetch /api/health.
 */
export type HealthLevel = "unknown" | "ok" | "degraded" | "down";

export type HealthSnapshot = {
  level: HealthLevel;
  checkedAt: number | null;
  database?: string;
  llm?: string;
  embed?: string;
  corpusSections?: number;
  version?: string;
  startedAt?: string;
};

type HealthBody = {
  ok?: boolean;
  database?: string;
  llm?: string;
  embed?: string;
  corpusSections?: number;
  version?: string;
  startedAt?: string;
};

const INTERVAL = 60_000;
/** Focus/online re-checks are skipped when the last probe is this fresh. */
const MIN_GAP = 5_000;
/** The backend's own probes give up after 3 s each; leave room for all of them. */
const TIMEOUT = 8_000;
const ENDPOINT = `${API_URL}/api/health`;

const INITIAL: HealthSnapshot = { level: "unknown", checkedAt: null };
let snapshot: HealthSnapshot = INITIAL;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let inflight: Promise<HealthSnapshot> | null = null;
let wired = false;

function emit() {
  for (const cb of listeners) cb();
}

/** Ranks a response: the model must answer for "ok"; a missing embedder or an empty corpus degrades. */
export function levelFrom(status: number | "network", body: HealthBody | null): HealthLevel {
  if (status === "network" || !body) return "down";
  if (body.llm !== undefined && body.llm !== "ok") return "down";
  if (body.database !== undefined && body.database !== "ok") return "down";
  if (status >= 500 && body.llm === undefined) return "down";
  const embedOk = body.embed === undefined || body.embed === "ok";
  const corpusOk = body.corpusSections === undefined || body.corpusSections > 0;
  return embedOk && corpusOk ? "ok" : "degraded";
}

async function probe(): Promise<HealthSnapshot> {
  let status: number | "network" = "network";
  let body: HealthBody | null = null;
  try {
    const res = await fetch(ENDPOINT, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT) });
    status = res.status;
    try {
      body = (await res.json()) as HealthBody;
    } catch {
      body = null;
    }
  } catch {
    status = "network";
  }
  return {
    level: levelFrom(status, body),
    checkedAt: Date.now(),
    database: body?.database,
    llm: body?.llm,
    embed: body?.embed,
    corpusSections: body?.corpusSections,
    version: body?.version,
    startedAt: body?.startedAt,
  };
}

/** Fetches now (sharing any request already in flight) and publishes the result. */
export function refreshHealth(): Promise<HealthSnapshot> {
  if (inflight) return inflight;
  inflight = probe()
    .then((next) => {
      snapshot = next;
      emit();
      return next;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function refreshIfStale() {
  if (snapshot.checkedAt === null || Date.now() - snapshot.checkedAt > MIN_GAP) void refreshHealth();
}

function startTimer() {
  if (timer || document.visibilityState !== "visible") return;
  timer = setInterval(() => void refreshHealth(), INTERVAL);
}

function stopTimer() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

function onVisibility() {
  if (document.visibilityState === "visible") {
    refreshIfStale();
    startTimer();
  } else {
    stopTimer();
  }
}

/** Wires the window listeners once and probes immediately; runs on the first subscriber. */
function wire() {
  if (wired) return;
  wired = true;
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", refreshIfStale);
  window.addEventListener("online", refreshIfStale);
  void refreshHealth();
  startTimer();
}

function unwire() {
  if (!wired || listeners.size) return;
  wired = false;
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("focus", refreshIfStale);
  window.removeEventListener("online", refreshIfStale);
  stopTimer();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  wire();
  return () => {
    listeners.delete(cb);
    unwire();
  };
}

export function getHealth(): HealthSnapshot {
  return snapshot;
}

/** Live health for the UI. Server snapshot is "unknown"; the first probe lands after mount. */
export function useHealth(): HealthSnapshot {
  return useSyncExternalStore(subscribe, getHealth, () => INITIAL);
}

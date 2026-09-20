"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A localStorage-backed value as an external store, the same pattern as
 * history.ts and the jurisdiction provider. Keys are prefixed "coop.".
 *
 * The server snapshot is always `initial`, so markup matches on hydration
 * and the stored value appears right after. Parsed values are cached per
 * key so the snapshot keeps a stable reference between renders.
 */
const cache = new Map<string, { raw: string | null; value: unknown }>();

function eventFor(key: string) {
  return `coop:${key}`;
}

export function readPersisted<T>(key: string, initial: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return initial;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = initial;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initial;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writePersisted<T>(key: string, value: T): void {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full */
  }
  window.dispatchEvent(new Event(eventFor(key)));
}

/** Same-tab writes fire "coop:<key>"; other tabs arrive through "storage". */
export function subscribePersisted(key: string, cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === key) cb();
  };
  window.addEventListener(eventFor(key), cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(eventFor(key), cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePersisted<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    useCallback((cb: () => void) => subscribePersisted(key, cb), [key]),
    () => readPersisted(key, initial),
    () => initial,
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readPersisted(key, initial);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writePersisted(key, resolved);
    },
    [key, initial],
  );
  return [value, set];
}

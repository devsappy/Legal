"use client";

import { readPersisted, usePersisted, writePersisted } from "@/hooks/usePersisted";

/**
 * Per-device preferences from Settings › Preferences. Stored as one object
 * under coop.prefs; readers get the defaults merged in so a preference added
 * later never comes back undefined.
 */
export type Prefs = {
  /** Enter sends the question; off makes Enter insert a newline. */
  enterSends: boolean;
  /** Show the retrieval trace (understand / search / verify / draft) above answers. */
  showTrace: boolean;
  /** Read each answer aloud as it finishes. */
  autoRead: boolean;
  /** Disable entrance and ambient animation regardless of the OS setting. */
  reduceMotion: boolean;
};

const KEY = "coop.prefs";

export const DEFAULT_PREFS: Prefs = {
  enterSends: true,
  showTrace: true,
  autoRead: false,
  reduceMotion: false,
};

/** Fills gaps with defaults. Memoised per stored object so the result is a stable reference. */
const filled = new WeakMap<object, Prefs>();
function withDefaults(stored: Partial<Prefs> | null | undefined): Prefs {
  if (!stored || typeof stored !== "object") return DEFAULT_PREFS;
  const hit = filled.get(stored);
  if (hit) return hit;
  const complete = (Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]).every((k) => typeof stored[k] === "boolean");
  const result = complete ? (stored as Prefs) : { ...DEFAULT_PREFS, ...stored };
  filled.set(stored, result);
  return result;
}

export function getPrefs(): Prefs {
  return withDefaults(readPersisted<Partial<Prefs>>(KEY, DEFAULT_PREFS));
}

export function usePrefs(): Prefs {
  const [stored] = usePersisted<Partial<Prefs>>(KEY, DEFAULT_PREFS);
  return withDefaults(stored);
}

/** The DOM flag globals.css keys its reduced-motion rules on. */
export function applyMotionPreference(reduce: boolean): void {
  if (typeof document === "undefined") return;
  if (reduce) document.documentElement.dataset.motion = "reduced";
  else delete document.documentElement.dataset.motion;
}

export function setPref<K extends keyof Prefs>(k: K, v: Prefs[K]): void {
  const next = { ...getPrefs(), [k]: v };
  writePersisted(KEY, next);
  if (k === "reduceMotion") applyMotionPreference(Boolean(v));
}

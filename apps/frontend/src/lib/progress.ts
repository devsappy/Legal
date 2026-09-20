"use client";

import { readPersisted, usePersisted, writePersisted } from "@/hooks/usePersisted";

/**
 * Which steps of each procedure checklist the user has ticked, per device:
 * { [slug]: [doneStepIndex, ...] } under coop.progress. The checklist page
 * writes it; the dashboard reads it for progress rings.
 */
const KEY = "coop.progress";
const EMPTY: number[] = [];
const NONE: Record<string, number[]> = {};

export type ProgressMap = Record<string, number[]>;

export function useAllProgress(): ProgressMap {
  const [all] = usePersisted<ProgressMap>(KEY, NONE);
  return all;
}

/** Done step indexes for one procedure, sorted ascending. */
export function useProgress(slug: string): number[] {
  const all = useAllProgress();
  return all[slug] ?? EMPTY;
}

export function getProgress(slug: string): number[] {
  return readPersisted<ProgressMap>(KEY, NONE)[slug] ?? EMPTY;
}

export function toggleStep(slug: string, index: number): void {
  const all = readPersisted<ProgressMap>(KEY, NONE);
  const done = all[slug] ?? EMPTY;
  const next = done.includes(index) ? done.filter((i) => i !== index) : [...done, index].sort((a, b) => a - b);
  writePersisted(KEY, { ...all, [slug]: next });
}

export function resetProgress(slug: string): void {
  const all = readPersisted<ProgressMap>(KEY, NONE);
  if (!(slug in all)) return;
  writePersisted(KEY, Object.fromEntries(Object.entries(all).filter(([k]) => k !== slug)));
}

/** Wipes every procedure's progress (sign-out "clear this device"). */
export function clearProgress(): void {
  writePersisted(KEY, undefined);
}

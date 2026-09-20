"use client";

import { readPersisted, usePersisted, writePersisted } from "@/hooks/usePersisted";

/**
 * Pinned conversations, by id, newest pin first. Stored per device under
 * coop.pins; the sidebar lifts them into a "Pinned" bucket above Today.
 */
const KEY = "coop.pins";
const EMPTY: string[] = [];

export function usePins(): string[] {
  const [pins] = usePersisted<string[]>(KEY, EMPTY);
  return pins;
}

export function getPins(): string[] {
  return readPersisted<string[]>(KEY, EMPTY);
}

export function isPinned(id: string): boolean {
  return getPins().includes(id);
}

export function togglePin(id: string): boolean {
  const current = getPins();
  const pinned = current.includes(id);
  writePersisted(KEY, pinned ? current.filter((x) => x !== id) : [id, ...current]);
  return !pinned;
}

export function unpin(id: string): void {
  const current = getPins();
  if (current.includes(id)) writePersisted(KEY, current.filter((x) => x !== id));
}

export function clearPins(): void {
  writePersisted(KEY, undefined);
}

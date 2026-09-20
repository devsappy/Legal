"use client";

import { useSyncExternalStore } from "react";
import type { Combo } from "./keys";

/**
 * The one registry of keyboard shortcuts. useHotkey registers while its
 * component is mounted; the shortcuts sheet and the command palette read the
 * list. Labels arrive already translated because the caller has the `t`.
 */
export type ShortcutScope = "global" | "chat" | "table" | "drawer" | "palette";

export type Shortcut = {
  id: string;
  combo: Combo;
  scope: ShortcutScope;
  label: string;
};

/** Display order for the sheet. */
export const SCOPE_ORDER: ShortcutScope[] = ["global", "chat", "table", "drawer", "palette"];

const EMPTY: Shortcut[] = [];
let list: Shortcut[] = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) cb();
}

/**
 * Adds (or replaces, by id) a shortcut and returns the function that removes
 * it. Removal only takes effect for the entry this call added, so a later
 * registration with the same id is not clobbered by an earlier unmount.
 */
export function registerShortcut(s: Shortcut): () => void {
  list = [...list.filter((x) => x.id !== s.id), s];
  emit();
  return () => {
    if (!list.includes(s)) return;
    list = list.filter((x) => x !== s);
    emit();
  };
}

export function getShortcuts(): Shortcut[] {
  return list;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Everything registered right now, in registration order. */
export function useShortcutList(): Shortcut[] {
  return useSyncExternalStore(subscribe, getShortcuts, () => EMPTY);
}

/** Buckets by scope in SCOPE_ORDER, dropping empty scopes. */
export function groupShortcuts(shortcuts: Shortcut[]): { scope: ShortcutScope; items: Shortcut[] }[] {
  return SCOPE_ORDER.map((scope) => ({ scope, items: shortcuts.filter((s) => s.scope === scope) })).filter(
    (g) => g.items.length > 0,
  );
}

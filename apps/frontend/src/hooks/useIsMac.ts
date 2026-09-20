"use client";

import { useSyncExternalStore } from "react";
import { isMac } from "@/lib/keys";

const noop = () => () => {};

/**
 * Whether to draw ⌘ or Ctrl. False on the server so the markup is stable;
 * the client value arrives right after hydration.
 */
export function useIsMac(): boolean {
  return useSyncExternalStore(noop, isMac, () => false);
}

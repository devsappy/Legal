"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False during server rendering and hydration, true afterwards. Use it to
 * hold back UI that depends on browser-only state (localStorage lists,
 * platform-specific key labels) so the first paint matches the server.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

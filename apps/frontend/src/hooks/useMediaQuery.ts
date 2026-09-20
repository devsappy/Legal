"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a media query, e.g. useMediaQuery("(max-width: 639px)") for the
 * phone layout or "(hover: none)" for touch. False on the server and during
 * hydration, so components should render the wider layout by default.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

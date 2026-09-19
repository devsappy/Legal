"use client";

import { useSyncExternalStore } from "react";

/**
 * Resolves a CSS custom property (e.g. "--seal") to its computed value.
 * Needed where a component paints to <canvas> and cannot read CSS variables.
 * Re-reads when the colour scheme flips.
 */
export function useToken(name: string, fallback: string): string {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback,
    () => fallback,
  );
}

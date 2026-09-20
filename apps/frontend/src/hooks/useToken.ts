"use client";

import { useSyncExternalStore } from "react";
import { THEME_EVENT } from "@/components/layout/ThemeToggle";

/**
 * Resolves a CSS custom property (e.g. "--seal") to its computed value.
 * Needed where a component paints to <canvas> or SVG and cannot read CSS
 * variables. Re-reads when the theme toggles (the "coop:theme" event fired
 * by applyTheme); the OS colour scheme is not consulted.
 */
function subscribe(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}

export function useToken(name: string, fallback: string): string {
  return useSyncExternalStore(
    subscribe,
    () => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback,
    () => fallback,
  );
}

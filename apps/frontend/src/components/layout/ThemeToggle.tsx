"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import clsx from "clsx";

/**
 * Light is the default; dark is opt-in via <html data-theme="dark"> (see
 * globals.css). The OS colour scheme is ignored. The choice is remembered
 * per browser and applied before paint by the inline script in the root
 * layout, so the first client read comes from that attribute rather than
 * storage and the icon never flashes.
 */
export type ThemeMode = "light" | "dark";

export const THEME_KEY = "coop.theme";
export const THEME_EVENT = "coop:theme";

function readAttribute(): ThemeMode {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  // Another tab switching theme arrives through "storage".
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === THEME_KEY) {
      applyAttribute(e.newValue === "dark" ? "dark" : "light");
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Sets the attribute and the browser-chrome colour; the meta follows --paper so it tracks the tokens. */
function applyAttribute(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    const paper = getComputedStyle(root).getPropertyValue("--paper").trim();
    if (paper) meta.content = paper;
  }
}

/** Persists the choice, updates <html data-theme> and the theme-color meta, and notifies listeners. */
export function applyTheme(mode: ThemeMode): void {
  const next: ThemeMode = mode === "dark" ? "dark" : "light";
  applyAttribute(next);
  try {
    if (next === "dark") localStorage.setItem(THEME_KEY, "dark");
    else localStorage.removeItem(THEME_KEY);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

/** The current theme. `resolved` equals `mode` (there is no system mode) and is kept for callers that only care about the paint. */
export function useTheme(): { mode: ThemeMode; resolved: ThemeMode } {
  const mode = useSyncExternalStore(subscribe, readAttribute, () => "light" as const);
  return { mode, resolved: mode };
}

type Props = {
  className?: string;
  /** "onDark" draws the button in paper for ink-tinted headers. */
  tone?: "auto" | "onDark";
};

export function ThemeToggle({ className, tone = "auto" }: Props) {
  const t = useTranslations("ui.theme");
  const { mode } = useTheme();
  const next: ThemeMode = mode === "dark" ? "light" : "dark";
  const label = t(next);
  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={label}
      title={label}
      data-theme-toggle={mode}
      className={clsx(
        "h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors",
        tone === "onDark" ? "text-paper/85 hover:text-paper hover:bg-paper/10" : "text-ink-2 hover:text-ink hover:bg-muted",
        className,
      )}
    >
      {mode === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";

/**
 * Light is the default; dark is opt-in via <html data-theme="dark"> (see
 * globals.css). The choice is remembered per browser and applied before
 * paint by the inline script in the root layout.
 */
const KEY = "coop.theme";
const EVENT = "coop:theme";

function read(): "light" | "dark" {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("shell");
  const theme = useSyncExternalStore(subscribe, read, () => "light" as const);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={next === "dark" ? t("darkMode") : t("lightMode")}
      title={next === "dark" ? t("darkMode") : t("lightMode")}
      className={className ?? "h-8 w-8 inline-flex items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-muted"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

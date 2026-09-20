"use client";

import { useSyncExternalStore } from "react";
import clsx from "clsx";
import { formatShortcut, type Combo } from "@/lib/keys";

type Props = {
  /** Combo grammar from lib/keys: 'mod+k', 'mod+shift+o', 'shift+/', 'escape', 'g h'. */
  combo: Combo;
  className?: string;
};

/*
 * formatShortcut() is platform-aware ('mod' is ⌘ on a Mac) and the server
 * does not know the platform, so it renders the Ctrl/Alt/Shift spelling.
 * To hydrate without a mismatch the server snapshot maps the Mac glyphs
 * back to that spelling; after hydration the store re-reads the real
 * labels and, on a Mac only, swaps them for ⌘/⌥/⇧. Snapshots are strings
 * so identical renderings never cause a second render.
 */
const NEUTRAL: Record<string, string> = { "⌘": "Ctrl", "⌥": "Alt", "⇧": "Shift" };

/* ASCII unit separator: never appears in a key label. */
const SEP = String.fromCharCode(31);

const subscribe = () => () => {};

/** One mono chip per key. Client-only because the glyphs depend on the platform. */
export function Kbd({ combo, className }: Props) {
  const keys = useSyncExternalStore(
    subscribe,
    () => formatShortcut(combo).join(SEP),
    () =>
      formatShortcut(combo)
        .map((key) => NEUTRAL[key] ?? key)
        .join(SEP),
  ).split(SEP);

  return (
    <span className={clsx("inline-flex items-center gap-0.5 align-middle", className)}>
      {keys.map((key, i) => (
        <kbd
          // Keys can repeat inside a chord ('g g'), so the index is part of the key.
          key={`${i}-${key}`}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-rule bg-sheet px-1 font-mono text-2xs font-medium leading-none text-ink-2"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

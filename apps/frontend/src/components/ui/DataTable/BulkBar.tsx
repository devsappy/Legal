"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Portal } from "../Portal";
import type { DataTableLabels } from "./types";

type Props = {
  labels: DataTableLabels;
  count: number;
  onClear: () => void;
  children?: ReactNode;
};

/**
 * Inverted pill fixed to the bottom centre of the viewport while rows are
 * selected: "{n} selected", the caller's bulk actions, and a clear button.
 * Escape clears the selection unless a menu or dialog took the key first.
 * Portalled so <main>'s scrolling never moves it.
 */
export function BulkBar({ labels, count, onClear, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      onClear();
    };
    // Bubble phase on document: menus and popovers on the elements run first.
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClear]);

  return (
    <Portal>
      <div
        role="toolbar"
        aria-label={labels.selected(count)}
        data-motion
        className="rise fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-(--z-sticky) flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full bg-ink py-1.5 pl-4 pr-1.5 text-sm text-paper shadow-overlay"
      >
        <span className="whitespace-nowrap font-medium tabular-nums">{labels.selected(count)}</span>
        {children && (
          <div className="flex items-center gap-1 border-l border-paper/20 pl-2 [&_button]:text-paper [&_button:hover]:bg-paper/15">
            {children}
          </div>
        )}
        <button
          type="button"
          aria-label={labels.clear}
          onClick={onClear}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-paper/70 transition-colors hover:bg-paper/15 hover:text-paper"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    </Portal>
  );
}

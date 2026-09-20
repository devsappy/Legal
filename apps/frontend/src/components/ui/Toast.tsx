"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import clsx from "clsx";
import { Check, Info, OctagonAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { getSnapshot, subscribe, toast, type ToastItem } from "@/lib/toast";
import { Portal } from "./Portal";
import { Spinner } from "./Spinner";

/** Newest three are shown; the store already drops older ones. */
const MAX_VISIBLE = 3;

/** Matches the toast-out keyframe in globals.css. */
const EXIT_MS = 120;

const EMPTY: ToastItem[] = [];
const getServerSnapshot = () => EMPTY;

export type ToasterLabels = {
  /** Button copy for toast.undo(); defaults to the translated `ui.undo`. */
  undo: string;
  /** Accessible name of the close button; defaults to the translated `ui.dismiss`. */
  dismiss: string;
  /** Accessible name of the whole region; defaults to the translated `ui.notifications`. */
  region: string;
};

function reducedMotion(): boolean {
  return (
    document.documentElement.dataset.motion === "reduced" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Plays the short exit (globals.css `.toast[data-state="closing"]`) before the store drops the item. */
function leaveThen(node: HTMLElement | null, id: string) {
  if (!node || reducedMotion()) {
    toast.dismiss(id);
    return;
  }
  node.dataset.state = "closing";
  window.setTimeout(() => toast.dismiss(id), EXIT_MS);
}

/**
 * Renders the toast store from lib/toast.ts. Fixed bottom-right (full width
 * above the safe area on phones), three at a time, newest at the bottom.
 * Timers live here rather than in the store so they can pause while the
 * toast is hovered or focused and while the tab is hidden. Escape dismisses
 * the newest toast unless something closer to the key press (a menu, a
 * popover) already handled it. Mounted once in the locale layout.
 */
export function Toaster({ labels: overrides }: { labels?: Partial<ToasterLabels> } = {}) {
  const t = useTranslations("ui");
  const labels: ToasterLabels = {
    undo: overrides?.undo ?? t("undo"),
    dismiss: overrides?.dismiss ?? t("dismiss"),
    region: overrides?.region ?? t("notifications"),
  };
  const all = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const visible = all.slice(-MAX_VISIBLE);
  const region = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!all.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // A focused toast goes first; otherwise the newest one.
      const active = document.activeElement as HTMLElement | null;
      const focused = region.current?.contains(active) ? active?.closest<HTMLElement>("[data-toast-id]") : null;
      const id = focused?.dataset.toastId ?? all[all.length - 1].id;
      leaveThen(focused ?? region.current?.querySelector<HTMLElement>(`[data-toast-id="${CSS.escape(id)}"]`) ?? null, id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [all]);

  return (
    <Portal>
      <div
        ref={region}
        aria-label={labels.region}
        className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-(--z-toast) flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[380px]"
      >
        {visible.map((item) => (
          <ToastCard key={item.id} item={item} labels={labels} />
        ))}
      </div>
    </Portal>
  );
}

function ToastCard({ item, labels }: { item: ToastItem; labels: ToasterLabels }) {
  const { id, kind, duration } = item;
  const action = item.action ?? (item.onUndo ? { label: labels.undo, onClick: item.onUndo } : undefined);
  const isError = kind === "error";
  const sticky = kind === "loading" || !Number.isFinite(duration) || duration <= 0;
  const el = useRef<HTMLDivElement>(null);
  const paused = useRef(0);
  // Handlers the JSX calls; the effect below fills them in while a countdown runs.
  const controls = useRef<{ hold: () => void; release: () => void } | null>(null);

  // One countdown per toast: hover, focus and a hidden tab pause it, and the
  // remaining time carries over when they end.
  useEffect(() => {
    if (sticky) return;
    let remaining = duration;
    let startedAt = Date.now();
    let timer: number | null = null;
    const fire = () => {
      timer = null;
      leaveThen(el.current, id);
    };
    const pause = () => {
      if (timer === null) return;
      window.clearTimeout(timer);
      timer = null;
      remaining -= Date.now() - startedAt;
    };
    const resume = () => {
      if (timer !== null || paused.current > 0 || document.hidden) return;
      startedAt = Date.now();
      timer = window.setTimeout(fire, Math.max(remaining, 400));
    };
    const onVisibility = () => (document.hidden ? pause() : resume());
    document.addEventListener("visibilitychange", onVisibility);
    controls.current = {
      hold: () => {
        paused.current += 1;
        pause();
      },
      release: () => {
        paused.current = Math.max(0, paused.current - 1);
        resume();
      },
    };
    resume();
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      controls.current = null;
    };
  }, [id, duration, sticky]);

  return (
    <div
      ref={el}
      data-toast-id={id}
      data-motion
      role={isError ? "alert" : "status"}
      onPointerEnter={() => controls.current?.hold()}
      onPointerLeave={() => controls.current?.release()}
      onFocus={() => controls.current?.hold()}
      onBlur={() => controls.current?.release()}
      className={clsx(
        "toast pointer-events-auto flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm shadow-overlay",
        isError ? "border border-seal/40 bg-sheet text-ink" : "bg-ink text-paper",
      )}
    >
      <span
        aria-hidden
        className={clsx("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center", isError ? "text-seal" : "text-paper")}
      >
        {kind === "loading" ? (
          <Spinner size={14} />
        ) : isError ? (
          <OctagonAlert size={15} strokeWidth={2} />
        ) : kind === "success" ? (
          <Check size={15} strokeWidth={2.5} />
        ) : (
          <Info size={15} strokeWidth={2} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{item.message}</p>
        {item.description && (
          <p className={clsx("mt-0.5 text-xs leading-snug", isError ? "text-ink-2" : "text-paper/75")}>
            {item.description}
          </p>
        )}
      </div>
      {action && (
        <button
          type="button"
          // The store wraps action handlers so they also remove the toast.
          onClick={action.onClick}
          className={clsx(
            "-my-0.5 h-7 shrink-0 rounded-md px-2 text-xs font-medium transition-colors",
            isError ? "border border-rule bg-sheet text-ink hover:bg-muted" : "bg-paper/15 text-paper hover:bg-paper/25",
          )}
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        aria-label={labels.dismiss}
        onClick={() => leaveThen(el.current, id)}
        className={clsx(
          "-my-0.5 -mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
          isError ? "text-ink-3 hover:bg-muted hover:text-ink" : "text-paper/70 hover:bg-paper/15 hover:text-paper",
        )}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}

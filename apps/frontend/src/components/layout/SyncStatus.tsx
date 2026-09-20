"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { retrySync, useSyncState, type SyncStatus as Status } from "@/lib/history";
import { relativeTime } from "@/lib/format";

/* A shared 30 s tick so "Saved · 2 minutes ago" keeps up without state in effects. */
const TICK = 30_000;
const tickListeners = new Set<() => void>();
let ticker: ReturnType<typeof setInterval> | null = null;
function subscribeTick(cb: () => void) {
  tickListeners.add(cb);
  if (!ticker) ticker = setInterval(() => tickListeners.forEach((fn) => fn()), TICK);
  return () => {
    tickListeners.delete(cb);
    if (tickListeners.size === 0 && ticker) {
      clearInterval(ticker);
      ticker = null;
    }
  };
}
const tickNow = () => Math.floor(Date.now() / TICK);
const tickServer = () => 0;

const DOT: Record<Status, string> = {
  idle: "bg-ink-3",
  saving: "bg-ink animate-pulse motion-reduce:animate-none [html[data-motion=reduced]_&]:animate-none",
  saved: "bg-ink",
  error: "bg-seal",
  offline: "border border-ink bg-sheet",
};

function useSyncLabel(): { status: Status; label: string } {
  const t = useTranslations("shell.sync");
  const locale = useLocale();
  const { status, lastSavedAt } = useSyncState();
  useSyncExternalStore(subscribeTick, tickNow, tickServer);
  const label =
    status === "saved" && lastSavedAt ? t("lastSaved", { time: relativeTime(lastSavedAt, locale) }) : t(status);
  return { status, label };
}

/**
 * What the server copy of the open conversation is doing. `line` is the
 * mono caption under the breadcrumb on /ask (with a Retry link when a push
 * failed); `dot` is the 6px indicator in the sidebar footer, hollow when
 * offline and seal when the last save failed.
 */
export function SyncStatus({ variant = "line", className }: { variant?: "line" | "dot"; className?: string }) {
  const t = useTranslations("shell.sync");
  const { status, label } = useSyncLabel();

  if (variant === "dot") {
    return (
      <Tooltip content={label} side="top">
        <span
          role="img"
          aria-label={`${t("status")}: ${label}`}
          className={clsx("inline-flex size-4 items-center justify-center", className)}
        >
          <span aria-hidden data-motion className={clsx("block size-1.5 rounded-full", DOT[status])} />
        </span>
      </Tooltip>
    );
  }

  const Icon = status === "offline" ? CloudOff : Cloud;
  return (
    <span
      role="status"
      className={clsx("inline-flex min-w-0 items-center gap-1.5 font-mono text-2xs text-ink-3", className)}
    >
      <Icon size={11} strokeWidth={2} aria-hidden className={status === "error" ? "text-seal" : undefined} />
      <span className={clsx("truncate", status === "error" && "text-seal")}>{label}</span>
      {status === "error" && (
        <button
          type="button"
          onClick={retrySync}
          className="inline-flex items-center gap-1 rounded-sm text-ink-2 underline-offset-2 hover:text-ink hover:underline"
        >
          <RefreshCw size={10} aria-hidden />
          {t("retry")}
        </button>
      )}
    </span>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Activity, Clock, LogIn, RotateCcw, TriangleAlert, WifiOff } from "lucide-react";
import clsx from "clsx";
import { Link } from "@/i18n/navigation";
import { Button, buttonClasses } from "@/components/ui/Button";
import { retryRemaining } from "@/lib/chat-error";
import { loginHref } from "@/lib/routes";
import type { ChatErrorInfo } from "@/lib/types";

type Props = {
  error: ChatErrorInfo | undefined;
  /** When the failed message was created; the rate-limit countdown falls back to it. */
  createdAt: number;
  onRetry: () => void;
  /** True while another answer is streaming, so Retry waits. */
  busy?: boolean;
  className?: string;
};

/** Ticks once a second until the deadline passes; 0 afterwards. */
function useCountdown(error: ChatErrorInfo | undefined, createdAt: number): number {
  const [remaining, setRemaining] = useState(() => retryRemaining(error, createdAt));
  useEffect(() => {
    if (retryRemaining(error, createdAt) <= 0) return;
    const id = window.setInterval(() => setRemaining(retryRemaining(error, createdAt)), 1000);
    return () => window.clearInterval(id);
  }, [error, createdAt]);
  return remaining;
}

/**
 * One card per failure kind. Seal is used here and nowhere else in the
 * transcript: a hairline seal border and the soft tint, never a red fill.
 */
export function ErrorCard({ error, createdAt, onRetry, busy, className }: Props) {
  const t = useTranslations("chat");
  const kind = error?.kind ?? "server";
  const remaining = useCountdown(error, createdAt);

  const retryButton = (label = t("retry"), disabled = false) => (
    <Button size="sm" variant="outline" onClick={onRetry} disabled={disabled || busy}>
      <RotateCcw size={13} aria-hidden /> {label}
    </Button>
  );

  let icon = <TriangleAlert size={15} strokeWidth={2} aria-hidden />;
  let title = t("error");
  let body: string | undefined;
  let actions: ReactNode = retryButton();

  switch (kind) {
    case "unauthorized":
      icon = <LogIn size={15} strokeWidth={2} aria-hidden />;
      title = t("sessionEnded");
      body = t("sessionEndedBody");
      actions = (
        <Link href={loginHref("/ask")} className={buttonClasses("primary", "sm")}>
          <LogIn size={13} aria-hidden /> {t("signInAgain")}
        </Link>
      );
      break;
    case "rate_limited":
      icon = <Clock size={15} strokeWidth={2} aria-hidden />;
      title = t("rateLimited");
      body = remaining > 0 ? t("retryIn", { seconds: remaining }) : t("rateLimitedBody");
      actions = retryButton(t("retry"), remaining > 0);
      break;
    case "timeout":
      icon = <Clock size={15} strokeWidth={2} aria-hidden />;
      title = t("tooLong");
      body = t("shorter");
      break;
    case "network":
      icon = <WifiOff size={15} strokeWidth={2} aria-hidden />;
      title = t("unreachable");
      body = t("unreachableBody");
      actions = (
        <>
          {retryButton()}
          <Link href="/status" target="_blank" rel="noopener" className={buttonClasses("ghost", "sm")}>
            <Activity size={13} aria-hidden /> {t("checkStatus")}
          </Link>
        </>
      );
      break;
    default:
      body = t("serverBody");
  }

  return (
    <div
      role="group"
      aria-label={title}
      className={clsx("mt-1 max-w-[68ch] rounded-lg border border-seal/40 bg-seal-soft px-3.5 py-3 text-sm text-ink", className)}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-seal">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          {body && <p className="mt-0.5 text-ink-2">{body}</p>}
          {kind === "server" && error?.message && (
            <p className="mt-1.5 break-words font-mono text-2xs text-ink-3">{error.message}</p>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-[26px]" data-print="hide">
        {actions}
      </div>
    </div>
  );
}

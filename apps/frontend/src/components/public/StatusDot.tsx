"use client";

import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { Link } from "@/i18n/navigation";
import { useHealth, type HealthLevel } from "@/lib/health";
import { formatTime } from "@/lib/format";
import { Tooltip } from "@/components/ui/Tooltip";

/* Ink when everything answers, hollow when search is degraded, seal only
   when the service is down, rule-strong until the first probe lands. */
const DOT: Record<HealthLevel, string> = {
  ok: "bg-ink",
  degraded: "border border-ink bg-transparent",
  down: "bg-seal",
  unknown: "bg-rule-strong",
};

const LABEL: Record<HealthLevel, "ok" | "degraded" | "down" | "checking"> = {
  ok: "ok",
  degraded: "degraded",
  down: "down",
  unknown: "checking",
};

/**
 * The footer's live service indicator: a 6px dot and the matching
 * ui.health label, linked to /status. Reads the shared health store (the
 * only /api/health poller) and announces changes politely.
 */
export function StatusDot({ className }: { className?: string }) {
  const t = useTranslations("ui.health");
  const locale = useLocale();
  const { level, checkedAt } = useHealth();
  const tip = checkedAt ? `${t("lastChecked")} · ${formatTime(checkedAt, locale)}` : t("checking");

  return (
    <Tooltip content={tip}>
      <Link
        href="/status"
        aria-live="polite"
        className={clsx(
          "inline-flex h-8 items-center gap-2 rounded-full border border-rule px-3 text-xs font-medium text-ink-2 transition-colors hover:border-rule-strong hover:text-ink",
          className,
        )}
      >
        <span className={clsx("size-1.5 shrink-0 rounded-full", DOT[level])} aria-hidden />
        <span className="whitespace-nowrap">{t(LABEL[level])}</span>
      </Link>
    </Tooltip>
  );
}

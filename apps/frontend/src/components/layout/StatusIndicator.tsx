"use client";

import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { Link } from "@/i18n/navigation";
import { Tooltip } from "@/components/ui/Tooltip";
import { useHealth, type HealthLevel } from "@/lib/health";
import { relativeTime } from "@/lib/format";

const DOT: Record<HealthLevel, string> = {
  ok: "bg-ink",
  degraded: "border border-ink bg-sheet",
  down: "bg-seal",
  unknown: "bg-rule-strong",
};

/**
 * A 7px health dot in the top bar: ink when everything answers, hollow
 * when search is degraded, seal when the model or database is down. Reads
 * the shared health store (no polling of its own) and links to /status.
 */
export function StatusIndicator({ className }: { className?: string }) {
  const t = useTranslations("ui.health");
  const s = useTranslations("shell");
  const locale = useLocale();
  const health = useHealth();
  const label = health.level === "unknown" ? t("checking") : t(health.level);
  const detail = health.checkedAt ? `${label} · ${t("lastChecked")} ${relativeTime(health.checkedAt, locale)}` : label;

  return (
    <Tooltip content={detail} side="bottom">
      <Link
        href="/status"
        aria-label={`${s("status")}: ${label}`}
        className={clsx(
          "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted",
          className,
        )}
      >
        <span
          aria-hidden
          data-level={health.level}
          className={clsx("block size-[7px] rounded-full transition-colors", DOT[health.level])}
        />
      </Link>
    </Tooltip>
  );
}

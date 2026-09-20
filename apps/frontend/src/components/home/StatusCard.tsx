"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { Link } from "@/i18n/navigation";
import { refreshHealth, useHealth, type HealthLevel } from "@/lib/health";
import { formatNumber, formatTime } from "@/lib/format";
import { Badge, type BadgeKind } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";

type Dot = "ok" | "degraded" | "down";

const DOT: Record<Dot, string> = {
  ok: "bg-ink",
  degraded: "border border-ink bg-transparent",
  down: "bg-seal",
};

const BADGE: Record<HealthLevel, BadgeKind> = { unknown: "soft", ok: "solid", degraded: "warn", down: "bad" };

/**
 * Live service health from the one poller in lib/health. The server
 * renders placeholders only — no probe is awaited on the way to the page —
 * and the rows fill in after the first client check (about a second),
 * then refresh every minute while the tab is visible.
 */
export function StatusCard() {
  const t = useTranslations("home");
  const th = useTranslations("ui.health");
  const locale = useLocale();
  const health = useHealth();
  const [refreshing, setRefreshing] = useState(false);
  const checked = health.checkedAt !== null;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refreshHealth();
    } finally {
      setRefreshing(false);
    }
  };

  const rows: { key: "database" | "model" | "embeddings" | "corpus"; dot: Dot; value: string }[] = checked
    ? [
        { key: "database", dot: health.database === "ok" ? "ok" : "down", value: health.database ?? "—" },
        { key: "model", dot: health.llm === "ok" ? "ok" : "down", value: health.llm ?? "—" },
        { key: "embeddings", dot: health.embed === "ok" ? "ok" : "degraded", value: health.embed ?? "—" },
        {
          key: "corpus",
          dot: (health.corpusSections ?? 0) > 0 ? "ok" : "degraded",
          value: health.corpusSections === undefined ? "—" : formatNumber(health.corpusSections, locale),
        },
      ]
    : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-ink">{t("statusTitle")}</h2>
          <p className="mt-1 text-xs text-ink-3">
            {health.checkedAt !== null ? t("checkedAt", { time: formatTime(health.checkedAt, locale) }) : t("checking")}
          </p>
        </div>
        <IconButton label={th("refresh")} size="sm" onClick={() => void refresh()} disabled={refreshing} className="-mr-2 -mt-1">
          <RefreshCw
            size={15}
            strokeWidth={1.75}
            className={clsx(refreshing && "animate-spin motion-reduce:animate-none [html[data-motion=reduced]_&]:animate-none")}
            aria-hidden
          />
        </IconButton>
      </div>

      <div className="mt-3">
        <Badge kind={BADGE[health.level]} dot={health.level !== "unknown"}>
          {th(health.level === "unknown" ? "checking" : health.level)}
        </Badge>
      </div>

      {checked ? (
        <dl className="mt-3 flex-1 divide-y divide-rule border-t border-rule">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-3 py-2 text-sm">
              <span className={clsx("size-2 shrink-0 rounded-full", DOT[r.dot])} aria-hidden />
              <dt className="flex-1 text-ink-2">{th(r.key)}</dt>
              <dd className={clsx("truncate font-mono text-xs tabular-nums", r.dot === "down" ? "text-seal" : "text-ink-3")}>
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="mt-3 flex-1 divide-y divide-rule border-t border-rule" aria-busy>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="ml-auto h-3 w-8" />
            </div>
          ))}
        </div>
      )}

      <Link
        href="/status"
        className="mt-3 inline-flex w-fit items-center gap-1 rounded-sm text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline"
      >
        {t("statusPage")}
        <ArrowUpRight size={12} aria-hidden />
      </Link>
    </div>
  );
}

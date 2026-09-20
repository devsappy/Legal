"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Badge, Button, Card, type BadgeKind } from "@/components/ui";
import { refreshHealth, useHealth, type HealthLevel } from "@/lib/health";
import { formatDateTime, formatTime, relativeTime } from "@/lib/format";
import { StatusList } from "./StatusList";

/** The status page re-probes more often than the shared 60 s poll while it is open and visible. */
const EVERY = 30_000;

/** Monochrome except "down": ok is the solid pill, degraded the hollow-dot warn pill. */
const OVERALL: Record<HealthLevel, { kind: BadgeKind; key: "ok" | "degraded" | "down" | "checking" }> = {
  ok: { kind: "solid", key: "ok" },
  degraded: { kind: "warn", key: "degraded" },
  down: { kind: "bad", key: "down" },
  unknown: { kind: "neutral", key: "checking" },
};

/**
 * The live part of /status. Reads the shared health store (which starts
 * polling on first subscription), adds a 30 s refresh while the tab is
 * visible, and renders the overall pill, the component rows, the checked
 * time, and version/uptime when the backend reports them. The server
 * renders only the "checking" state: no health data is in the HTML.
 */
export function StatusRefresh() {
  const t = useTranslations("status");
  const locale = useLocale();
  const health = useHealth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer === null) timer = setInterval(() => void refreshHealth(), EVERY);
    };
    const stop = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await refreshHealth();
    } finally {
      setBusy(false);
    }
  };

  const overall = OVERALL[health.level];
  const checked = health.checkedAt;
  const started = health.startedAt ? Date.parse(health.startedAt) : NaN;

  return (
    <Card padded={false} className="mt-8 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-rule px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1" role="status" aria-live="polite">
          <Badge kind={overall.kind} dot>
            {t(`overall.${overall.key}`)}
          </Badge>
          {checked !== null && (
            <span className="text-xs text-ink-3">
              {t.rich("checkedAt", {
                time: formatTime(checked, locale),
                at: (chunks) => (
                  <time dateTime={new Date(checked).toISOString()} title={formatDateTime(checked, locale)} className="tabular-nums">
                    {chunks}
                  </time>
                ),
              })}
            </span>
          )}
        </div>
        <Button type="button" size="sm" variant="outline" loading={busy} onClick={refresh}>
          <RefreshCw size={14} strokeWidth={2} aria-hidden />
          {t("refresh")}
        </Button>
      </div>

      <StatusList snapshot={health} />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-rule bg-muted/40 px-4 py-3 text-xs text-ink-3 sm:px-5">
        {health.version && (
          <span className="font-mono" lang="en">
            {t("version", { version: health.version })}
          </span>
        )}
        {Number.isFinite(started) && (
          <span title={formatDateTime(started, locale)}>{t("uptime", { time: relativeTime(started, locale) })}</span>
        )}
        <span className="ml-auto">{t("autoRefresh")}</span>
      </div>
    </Card>
  );
}

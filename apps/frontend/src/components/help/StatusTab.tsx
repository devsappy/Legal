"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { refreshHealth, useHealth, type HealthLevel } from "@/lib/health";
import { formatNumber, formatTime, relativeTime } from "@/lib/format";

type RowLevel = "ok" | "degraded" | "down" | "unknown";

const DOT: Record<RowLevel, string> = {
  ok: "bg-ink",
  degraded: "border border-ink bg-sheet",
  down: "bg-seal",
  unknown: "bg-rule-strong",
};

const OVERALL: Record<HealthLevel, "solid" | "warn" | "bad" | "neutral"> = {
  ok: "solid",
  degraded: "warn",
  down: "bad",
  unknown: "neutral",
};

function rowLevel(value: string | undefined, checked: boolean, critical: boolean): RowLevel {
  if (!checked || value === undefined) return "unknown";
  if (value === "ok") return "ok";
  return critical ? "down" : "degraded";
}

/**
 * The same breakdown as /status, read from the shared health store (no
 * extra polling). Refresh shares any probe already in flight, so pressing
 * it costs one request at most.
 */
export function StatusTab() {
  const t = useTranslations("ui.health");
  const h = useTranslations("help.status");
  const help = useTranslations("help");
  const locale = useLocale();
  const health = useHealth();
  const [busy, setBusy] = useState(false);
  const checked = health.checkedAt !== null;

  const rows: { key: string; label: string; level: RowLevel; detail?: string }[] = [
    { key: "database", label: t("database"), level: rowLevel(health.database, checked, true) },
    { key: "model", label: t("model"), level: rowLevel(health.llm, checked, true) },
    { key: "embeddings", label: t("embeddings"), level: rowLevel(health.embed, checked, false) },
    {
      key: "corpus",
      label: t("corpus"),
      level: !checked || health.corpusSections === undefined ? "unknown" : health.corpusSections > 0 ? "ok" : "degraded",
      detail: health.corpusSections !== undefined ? formatNumber(health.corpusSections, locale) : undefined,
    },
  ];

  const refresh = async () => {
    setBusy(true);
    try {
      await refreshHealth();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{h("overall")}</span>
          <Badge kind={OVERALL[health.level]} dot>
            {health.level === "unknown" ? t("checking") : t(health.level)}
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={refresh} loading={busy}>
          <RefreshCw size={13} aria-hidden />
          {t("refresh")}
        </Button>
      </div>

      <ul className="divide-y divide-rule rounded-lg border border-rule bg-sheet">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-3 px-3 py-2.5 text-sm">
            <span aria-hidden className={clsx("size-2 shrink-0 rounded-full", DOT[row.level])} />
            <span className="min-w-0 flex-1 text-ink">{row.label}</span>
            {row.detail && <span className="font-mono text-xs tabular-nums text-ink-2">{row.detail}</span>}
            <span className="sr-only">{row.level === "unknown" ? t("checking") : t(row.level)}</span>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        <dt className="text-ink-3">{t("lastChecked")}</dt>
        <dd className="font-mono text-ink-2">
          {health.checkedAt ? (
            <time dateTime={new Date(health.checkedAt).toISOString()} title={formatTime(health.checkedAt, locale)}>
              {relativeTime(health.checkedAt, locale)}
            </time>
          ) : (
            h("unknown")
          )}
        </dd>
        {health.version && (
          <>
            <dt className="text-ink-3">{help("version")}</dt>
            <dd className="font-mono text-ink-2">{health.version}</dd>
          </>
        )}
      </dl>

      <Link href="/status" className="inline-flex items-center gap-1.5 text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline">
        {h("openPage")}
        <ExternalLink size={12} aria-hidden />
      </Link>
    </div>
  );
}

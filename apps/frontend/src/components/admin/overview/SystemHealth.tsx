"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { RefreshCw } from "lucide-react";
import { refreshHealth, useHealth, type HealthLevel } from "@/lib/health";
import { formatTime } from "@/lib/format";
import { Badge, Button, Card, CardHeader, Spinner } from "@/components/ui";

type RowTone = "ok" | "warn" | "down" | "unknown";

/** ink = ok, hollow = degraded or unknown, seal = down. */
function Dot({ tone }: { tone: RowTone }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "size-2 shrink-0 rounded-full",
        tone === "ok" && "bg-ink",
        tone === "down" && "bg-seal",
        (tone === "warn" || tone === "unknown") && "border border-ink-3 bg-transparent",
      )}
    />
  );
}

function toneOf(value: string | undefined, level: HealthLevel): RowTone {
  if (level === "unknown" || value === undefined) return "unknown";
  return value === "ok" ? "ok" : "down";
}

/**
 * Database / language model / embeddings / corpus, straight from the one
 * health store (lib/health.ts polls; nothing here fetches on its own).
 * Refresh calls refreshHealth(), which shares any request already in flight,
 * so a click is exactly one /api/health request.
 */
export function SystemHealth() {
  const t = useTranslations("admin.overview");
  const tu = useTranslations("ui.health");
  const locale = useLocale();
  const h = useHealth();
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    setBusy(true);
    void refreshHealth().finally(() => setBusy(false));
  };

  const corpusTone: RowTone =
    h.level === "unknown" || h.corpusSections === undefined ? "unknown" : h.corpusSections > 0 ? "ok" : "warn";
  const embedTone: RowTone = h.level === "unknown" || h.embed === undefined ? "unknown" : h.embed === "ok" ? "ok" : "warn";

  const statusText = (tone: RowTone) => (tone === "ok" ? t("rowOk") : tone === "down" ? t("rowDown") : tone === "warn" ? tu("degraded") : t("rowUnknown"));

  const rows: { key: string; label: string; tone: RowTone; text: string }[] = [
    { key: "database", label: tu("database"), tone: toneOf(h.database, h.level), text: statusText(toneOf(h.database, h.level)) },
    { key: "llm", label: tu("model"), tone: toneOf(h.llm, h.level), text: statusText(toneOf(h.llm, h.level)) },
    { key: "embed", label: tu("embeddings"), tone: embedTone, text: embedTone === "warn" ? t("rowDown") : statusText(embedTone) },
    {
      key: "corpus",
      label: tu("corpus"),
      tone: corpusTone,
      text: h.corpusSections === undefined ? t("rowUnknown") : t("sectionsCount", { count: h.corpusSections }),
    },
  ];

  const headline =
    h.level === "ok" ? (
      <Badge kind="solid" dot>
        {tu("ok")}
      </Badge>
    ) : h.level === "degraded" ? (
      <Badge kind="warn" dot>
        {tu("degraded")}
      </Badge>
    ) : h.level === "down" ? (
      <Badge kind="bad" dot>
        {tu("down")}
      </Badge>
    ) : (
      <Badge kind="soft">{tu("checking")}</Badge>
    );

  return (
    <Card padded={false} as="section" className="flex min-w-0 flex-col">
      <CardHeader
        as="h2"
        title={t("systemHealth")}
        description={t("healthBody")}
        className="mb-0 border-b border-rule px-4 py-3 sm:px-5"
        actions={
          <Button size="sm" variant="ghost" onClick={refresh} disabled={busy} aria-busy={busy || undefined}>
            {busy ? <Spinner size={13} /> : <RefreshCw size={13} aria-hidden />}
            {tu("refresh")}
          </Button>
        }
      />
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5" aria-live="polite">
        {headline}
        <span className="font-mono text-2xs text-ink-3 tabular-nums" suppressHydrationWarning>
          {h.checkedAt ? t("checkedAt", { when: formatTime(h.checkedAt, locale) }) : t("notChecked")}
        </span>
      </div>
      <dl className="divide-y divide-rule border-t border-rule">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-5">
            <dt className="flex items-center gap-2 text-ink-2">
              <Dot tone={r.tone} />
              {r.label}
            </dt>
            <dd className={clsx("text-right tabular-nums", r.tone === "down" ? "text-seal" : "text-ink")}>{r.text}</dd>
          </div>
        ))}
      </dl>
      {h.version && <p className="border-t border-rule px-4 py-2 font-mono text-2xs text-ink-3 sm:px-5">v{h.version}</p>}
    </Card>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ListChecks } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { pick, type L } from "@sahayak/shared";
import { JURISDICTIONS } from "@/lib/config";
import { formatNumber } from "@/lib/format";
import { useAllProgress } from "@/lib/progress";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/** What the page sends down per procedure: enough for a row, not the steps themselves. */
export type ProcedureSummary = {
  slug: string;
  title: L;
  jurisdiction: string;
  steps: number;
};

type Props = {
  /** Every procedure the backend knows; null when the fetch failed. */
  procedures: ProcedureSummary[] | null;
};

const LIMIT = 3;

/** A 24px ring: rule track, ink arc scaled by pathLength so the dash maths is in percent. */
function Ring({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      className="shrink-0 -rotate-90"
    >
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-rule" />
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset={100 - pct}
        className="text-ink transition-[stroke-dashoffset] duration-(--dur-3) ease-(--ease-standard) motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
        data-motion
      />
    </svg>
  );
}

/**
 * Up to three procedures for the chosen Act, each with the progress the
 * checklist page has recorded on this device. The whole tile stays
 * useful when the Act has none: it points at the full list instead.
 */
export function ProcedureShortcuts({ procedures }: Props) {
  const t = useTranslations("home");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const router = useRouter();
  const { jurisdiction } = useJurisdiction();
  const progress = useAllProgress();
  const act = JURISDICTIONS.find((j) => j.id === jurisdiction) ?? JURISDICTIONS[0];

  const mine = procedures?.filter((p) => p.jurisdiction === jurisdiction) ?? [];
  // Procedures already started come first, so "continue" is one click away.
  const rows = [...mine]
    .sort((a, b) => (progress[b.slug]?.length ?? 0) - (progress[a.slug]?.length ?? 0))
    .slice(0, LIMIT);

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-base font-medium text-ink">{t("proceduresTitle")}</h2>
      <p className="mt-1 text-xs text-ink-3">{t("proceduresBody", { act: act.act })}</p>

      {procedures === null ? (
        <EmptyState
          compact
          tone="error"
          title={t("loadFailed")}
          action={
            <Button size="sm" onClick={() => router.refresh()}>
              {tUi("retry")}
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          compact
          icon={<ListChecks size={18} strokeWidth={1.75} />}
          title={t("noProcedures")}
          description={t("noProceduresBody")}
          action={
            <Link href="/checklists" className={buttonClasses("outline", "sm")}>
              {t("allProcedures")}
            </Link>
          }
        />
      ) : (
        <>
          <ul className="-mx-2 mt-3 flex flex-1 flex-col">
            {rows.map((p) => {
              const done = progress[p.slug]?.length ?? 0;
              const status = t("stepsDone", { done: formatNumber(done, locale), total: formatNumber(p.steps, locale) });
              return (
                <li key={p.slug}>
                  <Link
                    href={`/checklists/${p.slug}`}
                    className="group/p flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
                    style={{ outlineOffset: -2 }}
                  >
                    <Ring value={p.steps ? done / p.steps : 0} label={status} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{pick(p.title, locale)}</span>
                      <span className="mt-0.5 block font-mono text-2xs text-ink-3 tabular-nums" aria-hidden>
                        {status}
                      </span>
                    </span>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-ink-3 transition-transform group-hover/p:translate-x-0.5 motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/checklists"
            className="mt-3 inline-flex w-fit items-center gap-1 rounded-sm text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline"
          >
            {t("allProcedures")}
            <ArrowRight size={12} aria-hidden />
          </Link>
        </>
      )}
    </div>
  );
}

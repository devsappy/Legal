import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { Braces, Cpu, Database, Library } from "lucide-react";
import type { HealthSnapshot } from "@/lib/health";
import { formatNumber } from "@/lib/format";

export type ComponentKey = "database" | "model" | "embeddings" | "corpus";
export type ComponentState = "ok" | "degraded" | "down" | "unknown";

type Row = { key: ComponentKey; state: ComponentState; detail?: string };

const ICONS = { database: Database, model: Cpu, embeddings: Braces, corpus: Library } as const;

/** ink = ok, hollow ring = degraded, seal = down, faint = not checked yet. */
const DOT: Record<ComponentState, string> = {
  ok: "bg-ink",
  degraded: "border-2 border-ink bg-transparent",
  down: "bg-seal",
  unknown: "bg-rule-strong",
};

/**
 * Derives the four rows from a health snapshot. Before the first probe
 * everything is "unknown"; when the API itself could not be reached (no
 * body at all) every row is "down". The database and the model take the
 * service down; a missing embedder or an empty corpus only degrade it.
 */
export function rowsFrom(s: HealthSnapshot): Row[] {
  if (s.checkedAt === null) return (["database", "model", "embeddings", "corpus"] as ComponentKey[]).map((key) => ({ key, state: "unknown" }));
  const unreachable = s.database === undefined && s.llm === undefined && s.embed === undefined && s.corpusSections === undefined;
  if (unreachable) return (["database", "model", "embeddings", "corpus"] as ComponentKey[]).map((key) => ({ key, state: "down" }));
  const hard = (v: string | undefined): ComponentState => (v === undefined ? "unknown" : v === "ok" ? "ok" : "down");
  const soft = (v: string | undefined): ComponentState => (v === undefined ? "unknown" : v === "ok" ? "ok" : "degraded");
  const detail = (v: string | undefined) => (v && v !== "ok" ? v : undefined);
  const corpus = s.corpusSections;
  return [
    { key: "database", state: hard(s.database), detail: detail(s.database) },
    { key: "model", state: hard(s.llm), detail: detail(s.llm) },
    { key: "embeddings", state: soft(s.embed), detail: detail(s.embed) },
    { key: "corpus", state: corpus === undefined ? "unknown" : corpus > 0 ? "ok" : "degraded" },
  ];
}

/**
 * The component rows of the status page: icon, name, one-line purpose,
 * a state dot with its word, and the raw probe detail in mono when a
 * component is not "ok" (e.g. "unreachable", "http 502"). Presentational;
 * StatusRefresh feeds it the live snapshot.
 */
export function StatusList({ snapshot }: { snapshot: HealthSnapshot }) {
  const t = useTranslations("status");
  const locale = useLocale();
  const rows = rowsFrom(snapshot);
  const pending = snapshot.checkedAt === null;

  return (
    <ul className="divide-y divide-rule" aria-busy={pending || undefined}>
      {rows.map(({ key, state, detail }) => {
        const Icon = ICONS[key];
        const sections =
          key === "corpus" && snapshot.corpusSections !== undefined
            ? t("components.corpusSections", { count: snapshot.corpusSections, n: formatNumber(snapshot.corpusSections, locale) })
            : undefined;
        return (
          <li key={key} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-ink-2" aria-hidden>
              <Icon size={16} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{t(`components.${key}`)}</p>
              <p className="text-xs text-ink-3">{t(`descriptions.${key}`)}</p>
              {sections && <p className="mt-1 text-xs tabular-nums text-ink-2">{sections}</p>}
              {detail && (
                <p className="mt-1 font-mono text-xs text-ink-2" lang="en">
                  {detail}
                </p>
              )}
            </div>
            <p
              className={clsx(
                "flex shrink-0 items-center gap-2 pt-0.5 text-xs font-medium",
                state === "down" ? "text-seal" : pending ? "text-ink-3" : "text-ink-2",
              )}
            >
              <span className={clsx("size-2 shrink-0 rounded-full", DOT[state], pending && "skeleton")} aria-hidden />
              {t(`state.${state}`)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

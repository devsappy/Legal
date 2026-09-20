"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, SearchX } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "@/i18n/navigation";
import { JURISDICTIONS, pick, type Checklist } from "@sahayak/shared";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { ProcedureCard } from "./ProcedureCard";

const ALL = "all";

type Props = {
  procedures: Checklist[];
};

function Chip({ pressed, onClick, title, children }: { pressed: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      title={title}
      className={clsx(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors active:translate-y-px",
        pressed ? "border-ink bg-ink text-paper" : "border-rule bg-sheet text-ink-2 hover:border-rule-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Act chips (All + one per Act, defaulting to the Act the assistant is set
 * to, or ?act= from a breadcrumb) and a search over title and summary,
 * with the matches grouped by Act. State is local: the URL only seeds it.
 */
export function ProcedureFilters({ procedures }: Props) {
  const t = useTranslations("checklists");
  const locale = useLocale();
  const params = useSearchParams();
  const { jurisdiction } = useJurisdiction();

  const fromUrl = params.get("act");
  const seeded = fromUrl && (fromUrl === ALL || JURISDICTIONS.some((j) => j.id === fromUrl)) ? fromUrl : null;
  const [picked, setPicked] = useState<string | null>(seeded);
  const [query, setQuery] = useState("");
  const active = picked ?? jurisdiction;

  const q = query.trim().toLowerCase();
  const matches = procedures.filter((p) => {
    if (active !== ALL && p.jurisdiction !== active) return false;
    if (!q) return true;
    return pick(p.title, locale).toLowerCase().includes(q) || pick(p.summary, locale).toLowerCase().includes(q);
  });

  // Group by Act in the order the Acts are listed, dropping empty groups.
  const groups = JURISDICTIONS.map((j) => ({ j, items: matches.filter((p) => p.jurisdiction === j.id) })).filter(
    (g) => g.items.length > 0,
  );
  const counts = new Map(JURISDICTIONS.map((j) => [j.id, procedures.filter((p) => p.jurisdiction === j.id).length]));
  const filtered = active !== ALL || q !== "";
  let index = 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" data-print="hide">
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
          <div role="group" aria-label={t("filter")} className="flex items-center gap-1.5">
            <Chip pressed={active === ALL} onClick={() => setPicked(ALL)}>
              {t("all")}
              <span className="font-mono text-2xs opacity-70">{procedures.length}</span>
            </Chip>
            {JURISDICTIONS.map((j) => (
              <Chip key={j.id} pressed={active === j.id} onClick={() => setPicked(j.id)} title={j.act}>
                {j.short}
                <span className="font-mono text-2xs opacity-70">{counts.get(j.id) ?? 0}</span>
              </Chip>
            ))}
          </div>
        </div>
        <Input
          type="search"
          size="sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          icon={<Search size={14} aria-hidden />}
          className="md:max-w-[260px]"
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {t("groupCount", { count: matches.length })}
      </p>

      {matches.length === 0 ? (
        <EmptyState
          icon={<SearchX size={18} strokeWidth={1.75} />}
          title={t("noMatches")}
          description={t("noMatchesBody")}
          action={
            filtered ? (
              <Button
                size="sm"
                onClick={() => {
                  setPicked(ALL);
                  setQuery("");
                }}
              >
                {t("clearFilters")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        groups.map(({ j, items }) => (
          <section key={j.id} aria-labelledby={`act-${j.id}`} className="flex flex-col gap-3">
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rule pb-2">
              <h2 id={`act-${j.id}`} className="text-base font-medium text-ink">
                {j.act}
              </h2>
              <span className="font-mono text-xs text-ink-3">{t("groupCount", { count: items.length })}</span>
            </header>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-stagger>
              {items.map((p) => (
                <ProcedureCard key={p.slug} procedure={p} index={index++} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

/** The failed-fetch state for the procedures pages: a seal EmptyState with a Retry that re-renders the route. */
export function ProceduresUnavailable({ title, description }: { title: string; description?: string }) {
  const t = useTranslations("checklists");
  const router = useRouter();
  return (
    <EmptyState
      tone="error"
      title={title}
      description={description}
      action={
        <Button size="sm" onClick={() => router.refresh()}>
          {t("retry")}
        </Button>
      }
    />
  );
}

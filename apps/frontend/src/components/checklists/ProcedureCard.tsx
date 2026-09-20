"use client";

import type { CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { JURISDICTIONS, pick, type Checklist } from "@sahayak/shared";
import { Badge } from "@/components/ui/Badge";
import { useProgress } from "@/lib/progress";
import { ProgressRing } from "./ProgressRing";

type Props = {
  procedure: Checklist;
  /** Position in the grid, for the staggered entrance. */
  index?: number;
};

/**
 * One procedure in the index: Act, step count, title, summary, and how far
 * this device has got through it. A ring appears once a step is ticked,
 * "Continue" while partial, "Completed" when done.
 */
export function ProcedureCard({ procedure, index = 0 }: Props) {
  const t = useTranslations("checklists");
  const locale = useLocale();
  const total = procedure.steps.length;
  const done = useProgress(procedure.slug).filter((i) => i < total).length;
  const j = JURISDICTIONS.find((x) => x.id === procedure.jurisdiction);
  const partial = done > 0 && done < total;
  const complete = total > 0 && done >= total;
  const title = pick(procedure.title, locale);

  return (
    <li className="rise" style={{ animationDelay: `${Math.min(index, 11) * 40}ms` } as CSSProperties} data-motion>
      <Link
        href={`/checklists/${procedure.slug}`}
        className="group flex h-full flex-col rounded-lg border border-rule bg-sheet p-4 transition-[border-color,box-shadow,background-color] duration-(--dur-2) hover:border-rule-strong hover:bg-muted/30 hover:shadow-raised active:translate-y-px sm:p-5"
        aria-label={partial ? `${title} — ${t("doneOf", { done, total })}` : undefined}
      >
        <span className="mb-2.5 flex items-center gap-2">
          <span className="font-mono text-2xs tracking-wide text-ink-3">
            {j?.short} · {t("stepCount", { count: total })}
          </span>
          {partial && (
            <Badge kind="soft" className="ml-auto">
              {t("continueBadge")}
            </Badge>
          )}
          {complete && (
            <Badge kind="solid" className="ml-auto">
              {t("completed")}
            </Badge>
          )}
        </span>
        <span className="mb-1.5 text-lg font-medium leading-snug text-ink">{title}</span>
        <span className="flex-1 text-sm text-ink-2">{pick(procedure.summary, locale)}</span>
        <span className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 text-sm text-ink-2 transition-colors group-hover:text-ink">
            {t("steps")}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
          {done > 0 && <ProgressRing done={done} total={total} size={28} label={t("doneOf", { done, total })} />}
        </span>
      </Link>
    </li>
  );
}

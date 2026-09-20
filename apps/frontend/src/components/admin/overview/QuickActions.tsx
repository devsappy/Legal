"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, BookPlus, Inbox, RefreshCw, Upload } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatSeconds } from "@/lib/format";
import { Spinner } from "@/components/ui";
import { useReindex, useReindexElapsed } from "@/components/admin/documents/ReindexButton";

const TILE =
  "cell-link group/tile relative flex min-h-[120px] flex-col bg-sheet p-5 text-left focus-visible:z-10 disabled:cursor-wait";

function Body({ icon, title, body, trailing }: { icon: ReactNode; title: string; body: string; trailing?: ReactNode }) {
  return (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="text-ink-3" aria-hidden>
          {icon}
        </span>
        {trailing ?? (
          <ArrowUpRight
            size={14}
            aria-hidden
            className="text-ink-3 transition-transform motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none group-hover/tile:-translate-y-px group-hover/tile:translate-x-px"
          />
        )}
      </span>
      <span className="mt-auto block pt-5 text-sm font-medium text-ink">{title}</span>
      <span className="mt-1 block text-xs text-ink-2">{body}</span>
    </>
  );
}

/**
 * Four tiles in the landing's hairline grid. Three are links; "Rebuild
 * index" starts the shared reindex job in place and shows its elapsed time.
 * `.cell-link` inverts the tile to ink on hover and keyboard focus.
 */
export function QuickActions() {
  const t = useTranslations("admin.overview.quickActions");
  const { job, start } = useReindex();
  const elapsed = useReindexElapsed();
  const running = job.status === "running";

  return (
    <section aria-labelledby="quick-actions">
      <h2 id="quick-actions" className="mb-3 text-base font-medium text-ink">
        {t("title")}
      </h2>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule-strong bg-rule-strong sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/documents?upload=1" className={TILE}>
          <Body icon={<Upload size={16} strokeWidth={1.75} />} title={t("upload")} body={t("uploadBody")} />
        </Link>
        <button type="button" className={TILE} onClick={() => void start()} disabled={running} aria-busy={running || undefined}>
          <Body
            icon={running ? <Spinner size={16} /> : <RefreshCw size={16} strokeWidth={1.75} />}
            title={t("reindex")}
            body={t("reindexBody")}
            trailing={running ? <span className="font-mono text-2xs tabular-nums text-ink-3">{formatSeconds(elapsed)}</span> : undefined}
          />
        </button>
        <Link href="/admin/glossary?add=1" className={TILE}>
          <Body icon={<BookPlus size={16} strokeWidth={1.75} />} title={t("addTerm")} body={t("addTermBody")} />
        </Link>
        <Link href="/admin/queries?status=open" className={TILE}>
          <Body icon={<Inbox size={16} strokeWidth={1.75} />} title={t("review")} body={t("reviewBody")} />
        </Link>
      </div>
    </section>
  );
}

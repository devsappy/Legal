"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import type { ReviewRow } from "@sahayak/shared";
import { Link, useRouter } from "@/i18n/navigation";
import { reviews, sqliteDate } from "@/lib/admin-api";
import { formatDateTime, relativeTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Badge, Button, Card, CardHeader, EmptyState, Tooltip, buttonClasses } from "@/components/ui";

const REASON_KIND: Record<ReviewRow["reason"], "warn" | "bad"> = {
  low_confidence: "warn",
  thumbs_down: "bad",
  no_citation: "bad",
};

type Props = {
  /** The newest open reviews, already sorted; null when the fetch failed. */
  rows: ReviewRow[] | null;
  /** Open count for the "View all" pill. */
  total: number | null;
};

/**
 * The five newest open reviews with an inline Resolve. Rows live in local
 * state seeded from the server (re-seeded whenever the server sends new
 * rows) so resolving removes the row at once; Undo reverses the PATCH.
 */
export function AttentionList({ rows, total }: Props) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();

  const [prevRows, setPrevRows] = useState(rows);
  const [items, setItems] = useState<ReviewRow[]>(rows ?? []);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setItems(rows ?? []);
  }
  const inflight = useRef(0);

  const settle = () => {
    inflight.current -= 1;
    if (inflight.current === 0) router.refresh();
  };

  const restore = (row: ReviewRow) =>
    setItems((list) =>
      list.some((r) => r.id === row.id)
        ? list
        : [...list, row].sort((a, b) => sqliteDate(b.created_at).getTime() - sqliteDate(a.created_at).getTime()),
    );

  const resolve = async (row: ReviewRow) => {
    setItems((list) => list.filter((r) => r.id !== row.id));
    inflight.current += 1;
    try {
      await reviews.setStatus([row.id], "resolved");
      toast.undo(t("overview.resolved"), () => {
        inflight.current += 1;
        restore(row);
        reviews
          .setStatus([row.id], "open")
          .catch(() => {
            setItems((list) => list.filter((r) => r.id !== row.id));
            toast.error(t("reviews.failed"));
          })
          .finally(settle);
      });
    } catch {
      restore(row);
      toast.error(t("overview.resolveFailed"));
    } finally {
      settle();
    }
  };

  return (
    <Card padded={false} as="section" className="flex min-w-0 flex-col">
      <CardHeader
        as="h2"
        title={t("overview.attention")}
        description={t("overview.attentionBody")}
        className="mb-0 border-b border-rule px-4 py-3 sm:px-5"
        actions={
          <Link href="/admin/queries?status=open" className={buttonClasses("ghost", "sm")}>
            {t("overview.viewAll")}
            {total !== null && total > 0 && (
              <span className="rounded-full bg-muted px-1.5 font-mono text-2xs leading-4 text-ink-2 tabular-nums">{total}</span>
            )}
            <ArrowRight size={13} aria-hidden />
          </Link>
        }
      />
      {rows === null ? (
        <EmptyState compact tone="error" icon={<TriangleAlert size={18} strokeWidth={1.75} />} title={t("errors.loadFailed")} />
      ) : items.length === 0 ? (
        <EmptyState compact title={t("overview.attentionEmpty")} description={t("overview.attentionEmptyBody")} />
      ) : (
        <ul className="divide-y divide-rule">
          {items.map((r) => {
            const when = sqliteDate(r.created_at);
            return (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/queries?status=open&review=${r.id}`}
                    className="line-clamp-2 text-sm text-ink underline-offset-4 hover:underline"
                  >
                    {r.question}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
                    <Badge kind={REASON_KIND[r.reason]} dot>
                      {t(`reasons.${r.reason}`)}
                    </Badge>
                    <Tooltip content={formatDateTime(when, locale)}>
                      <time dateTime={when.toISOString()} className="font-mono tabular-nums" suppressHydrationWarning>
                        {relativeTime(when, locale)}
                      </time>
                    </Tooltip>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => void resolve(r)}>
                  <Check size={13} aria-hidden />
                  {t("overview.resolve")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Copy, MessageSquareText, RotateCcw } from "lucide-react";
import { JURISDICTIONS, LANGUAGES, type ReviewRow } from "@sahayak/shared";
import { Link } from "@/i18n/navigation";
import { useHotkey } from "@/hooks/useHotkey";
import { sqliteDate } from "@/lib/admin-api";
import { formatDateTime, relativeTime } from "@/lib/format";
import { askHref } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { Badge, Button, Drawer, IconButton, Kbd, Meter, buttonClasses } from "@/components/ui";

export const CONFIDENCE_FLOOR = 0.55;

export const REASON_KIND: Record<ReviewRow["reason"], "warn" | "bad"> = {
  low_confidence: "warn",
  thumbs_down: "bad",
  no_citation: "bad",
};

type Props = {
  row: ReviewRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 0-based position inside the list the arrows step through, and its length. */
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  /** Resolve or reopen the shown row. */
  onToggle: (row: ReviewRow) => void;
  busy: boolean;
};

/**
 * One review in a side panel (bottom sheet on phones): the flagged answer
 * in a scroll region, the facts as a definition list, and the actions.
 * ← / → step through the current table order and "r" flips the status;
 * all three live in the "drawer" scope so they only fire while it is open.
 */
export function ReviewDrawer({ row, open, onOpenChange, index, total, onPrev, onNext, onToggle, busy }: Props) {
  const t = useTranslations("admin.reviews");
  const tr = useTranslations("admin.reasons");
  const locale = useLocale();

  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < total - 1;

  useHotkey("arrowright", onNext, { id: "reviews.next", scope: "drawer", label: t("shortcuts.next"), enabled: open && hasNext });
  useHotkey("arrowleft", onPrev, { id: "reviews.prev", scope: "drawer", label: t("shortcuts.prev"), enabled: open && hasPrev });
  useHotkey("r", () => row && !busy && onToggle(row), {
    id: "reviews.toggle",
    scope: "drawer",
    label: t("shortcuts.toggle"),
    enabled: open && row !== null,
  });

  const copy = async () => {
    if (!row) return;
    try {
      await navigator.clipboard.writeText(row.question);
      toast.success(t("drawer.copied"));
    } catch {
      toast.error(t("drawer.copyFailed"));
    }
  };

  const when = row ? sqliteDate(row.created_at) : null;
  const language = row ? (LANGUAGES.find((l) => l.code === row.language)?.native ?? row.language) : "";
  const jurisdiction = row ? JURISDICTIONS.find((j) => j.id === row.jurisdiction) : undefined;
  const resolved = row?.status === "resolved";

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={row ? t("drawer.title", { id: row.id }) : t("title")}
      width="min(100vw,520px)"
      footer={
        row && (
          <div className="flex w-full flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <IconButton label={t("drawer.prev")} size="sm" variant="outline" onClick={onPrev} disabled={!hasPrev}>
                <ArrowLeft size={14} />
              </IconButton>
              <IconButton label={t("drawer.next")} size="sm" variant="outline" onClick={onNext} disabled={!hasNext}>
                <ArrowRight size={14} />
              </IconButton>
              {index >= 0 && (
                <span className="ml-1 font-mono text-2xs text-ink-3 tabular-nums">{t("drawer.position", { index: index + 1, total })}</span>
              )}
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Link href={askHref({ q: row.question, jurisdiction: row.jurisdiction })} className={buttonClasses("outline", "sm")}>
                <MessageSquareText size={14} aria-hidden />
                {t("drawer.openInAsk")}
              </Link>
              <Button size="sm" variant={resolved ? "outline" : "primary"} loading={busy} onClick={() => onToggle(row)}>
                {resolved ? <RotateCcw size={14} aria-hidden /> : <Check size={14} aria-hidden />}
                {resolved ? t("reopen") : t("resolve")}
                <Kbd combo="r" className="ml-1 max-sm:hidden" />
              </Button>
            </div>
          </div>
        )
      }
    >
      {row && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge kind={REASON_KIND[row.reason]} dot>
              {tr(row.reason)}
            </Badge>
            <Badge kind={resolved ? "soft" : "solid"}>{t(`status.${row.status}`)}</Badge>
          </div>

          <section className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{t("drawer.question")}</h3>
              <Button size="xs" variant="ghost" onClick={() => void copy()}>
                <Copy size={12} aria-hidden />
                {t("drawer.copyQuestion")}
              </Button>
            </div>
            <p className="text-base leading-relaxed text-ink">{row.question}</p>
          </section>

          <section className="flex flex-col gap-1.5">
            <h3 className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{t("drawer.answer")}</h3>
            <div className="scroll-thin max-h-[40vh] overflow-y-auto rounded-lg border border-rule bg-muted/40 p-3 text-sm leading-relaxed text-ink-2 whitespace-pre-wrap">
              {row.answer?.trim() ? row.answer : <span className="italic text-ink-3">{t("drawer.noAnswer")}</span>}
            </div>
          </section>

          <dl className="grid grid-cols-[minmax(0,max-content)_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-ink-3">{t("drawer.language")}</dt>
            <dd className="text-ink">{language}</dd>
            <dt className="text-ink-3">{t("drawer.act")}</dt>
            <dd className="text-ink">
              {jurisdiction ? (
                <>
                  {jurisdiction.act}
                  <span className="ml-1.5 font-mono text-xs text-ink-3">{jurisdiction.short}</span>
                </>
              ) : (
                row.jurisdiction
              )}
            </dd>
            <dt className="text-ink-3">{t("drawer.confidence")}</dt>
            <dd>
              <Meter value={row.confidence} threshold={CONFIDENCE_FLOOR} label={t("drawer.confidence")} showValue />
            </dd>
            <dt className="text-ink-3">{t("drawer.asked")}</dt>
            <dd className="text-ink">
              {when && (
                <time dateTime={when.toISOString()} suppressHydrationWarning>
                  {formatDateTime(when, locale)}
                  <span className="ml-1.5 text-ink-3">· {relativeTime(when, locale)}</span>
                </time>
              )}
            </dd>
          </dl>
        </div>
      )}
    </Drawer>
  );
}

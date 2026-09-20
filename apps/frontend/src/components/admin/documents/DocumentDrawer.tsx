"use client";

import { useLocale, useTranslations } from "next-intl";
import { Copy, Info } from "lucide-react";
import { JURISDICTIONS, type DocumentRow } from "@sahayak/shared";
import { formatDate, formatNumber, relativeTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Badge, Button, Drawer } from "@/components/ui";
import { ReindexButton } from "./ReindexButton";

type Props = {
  row: DocumentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * One corpus file: the path (with copy), the Act it belongs to, section
 * counts with a hint about untitled sections, and the rebuild shortcut.
 * Deleting or replacing is not offered by the API, and the drawer says so.
 */
export function DocumentDrawer({ row, open, onOpenChange }: Props) {
  const t = useTranslations("admin.corpus");
  const locale = useLocale();
  const jurisdiction = row ? JURISDICTIONS.find((j) => j.id === row.jurisdiction) : undefined;

  const copy = async () => {
    if (!row) return;
    try {
      await navigator.clipboard.writeText(row.file);
      toast.success(t("drawer.copied"));
    } catch {
      toast.error(t("drawer.copyFailed"));
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={row?.title ?? t("title")}
      description={jurisdiction ? `${jurisdiction.name} · ${jurisdiction.short}` : undefined}
      width="min(100vw,480px)"
      footer={
        row && (
          <>
            <Button variant="ghost" size="sm" onClick={() => void copy()}>
              <Copy size={14} aria-hidden />
              {t("drawer.copyPath")}
            </Button>
            <ReindexButton size="sm" variant="primary" className="ml-auto" />
          </>
        )
      }
    >
      {row && (
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-1.5">
            <h3 className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{t("drawer.file")}</h3>
            <code className="block break-all rounded-lg border border-rule bg-muted/40 px-3 py-2 font-mono text-xs text-ink">{row.file}</code>
          </section>

          <dl className="grid grid-cols-[minmax(0,max-content)_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-ink-3">{t("drawer.act")}</dt>
            <dd className="text-ink">{jurisdiction?.act ?? row.jurisdiction}</dd>
            <dt className="text-ink-3">{t("drawer.sections")}</dt>
            <dd className="font-mono tabular-nums text-ink">{formatNumber(row.sections, locale)}</dd>
            <dt className="text-ink-3">{t("drawer.untitled")}</dt>
            <dd className="text-ink">
              {row.untitled > 0 ? (
                <Badge kind="warn" dot>
                  {t("untitledCount", { count: row.untitled })}
                </Badge>
              ) : (
                <Badge kind="neutral">{t("titled")}</Badge>
              )}
              {row.untitled > 0 && <p className="mt-1.5 text-xs text-ink-2">{t("drawer.untitledHint")}</p>}
            </dd>
            <dt className="text-ink-3">{t("drawer.updated")}</dt>
            <dd className="text-ink">
              {row.updated ? (
                <time dateTime={row.updated} suppressHydrationWarning>
                  {formatDate(row.updated, locale)}
                  <span className="ml-1.5 text-ink-3">· {relativeTime(row.updated, locale)}</span>
                </time>
              ) : (
                t("neverUpdated")
              )}
            </dd>
          </dl>

          <p className="flex items-start gap-2 rounded-lg border border-rule bg-muted/40 px-3 py-2.5 text-xs text-ink-2">
            <Info size={14} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
            {t("drawer.noDelete")}
          </p>
        </div>
      )}
    </Drawer>
  );
}

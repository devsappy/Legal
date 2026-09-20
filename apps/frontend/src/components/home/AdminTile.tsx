"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, BookText, FileText, LayoutDashboard, ShieldCheck, TriangleAlert } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Props = {
  /** Open items in the review queue; null when /api/admin/reviews failed. */
  openReviews: number | null;
  /** Whether the embedding index matches the corpus; null when /api/admin/documents failed. */
  indexCurrent: boolean | null;
};

/**
 * Administrators' shortcuts: the review queue with its open count, the
 * documents workbench with the index state, the glossary and the
 * overview. Members never see this tile (the page decides by role).
 */
export function AdminTile({ openReviews, indexCurrent }: Props) {
  const t = useTranslations("home");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const router = useRouter();
  const failed = openReviews === null || indexCurrent === null;

  const links = [
    { key: "overview", href: "/admin", icon: LayoutDashboard, badge: null },
    {
      key: "documents",
      href: "/admin/documents",
      icon: FileText,
      badge:
        indexCurrent === null ? (
          <Badge kind="soft">—</Badge>
        ) : indexCurrent ? (
          <Badge kind="neutral" dot>
            {t("indexCurrent")}
          </Badge>
        ) : (
          <Badge kind="warn" dot>
            {t("indexStale")}
          </Badge>
        ),
    },
    { key: "glossary", href: "/admin/glossary", icon: BookText, badge: null },
    {
      key: "queries",
      href: "/admin/queries",
      icon: ShieldCheck,
      badge:
        openReviews === null ? (
          <Badge kind="soft">—</Badge>
        ) : (
          <Badge kind={openReviews > 0 ? "solid" : "neutral"}>{t("openReviews", { count: openReviews, n: formatNumber(openReviews, locale) })}</Badge>
        ),
    },
  ] as const;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-ink">{t("adminTitle")}</h2>
          <p className="mt-1 text-xs text-ink-3">{t("adminBody")}</p>
        </div>
        {failed && (
          <div className="flex items-center gap-2 text-xs text-seal">
            <TriangleAlert size={14} aria-hidden />
            {t("loadFailed")}
            <Button size="xs" onClick={() => router.refresh()}>
              {tUi("retry")}
            </Button>
          </div>
        )}
      </div>

      <nav aria-label={t("adminTitle")} className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong sm:grid-cols-2 lg:grid-cols-4">
        {links.map(({ key, href, icon: Icon, badge }) => (
          <Link
            key={key}
            href={href}
            className="group/a flex min-h-20 flex-col justify-between gap-3 bg-sheet p-4 transition-colors hover:bg-muted"
            style={{ outlineOffset: -2 }}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <Icon size={15} strokeWidth={1.75} className="text-ink-3" aria-hidden />
                {t(`adminLinks.${key}`)}
              </span>
              <ArrowUpRight
                size={14}
                className="shrink-0 text-ink-3 transition-transform group-hover/a:-translate-y-px group-hover/a:translate-x-px motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
                aria-hidden
              />
            </span>
            {badge && <span className="flex">{badge}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}

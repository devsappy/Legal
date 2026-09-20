import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export type Crumb = { label: string; href?: string };

type Props = {
  items: Crumb[];
  /** The nav's accessible name; defaults to the translated `ui.breadcrumb`. */
  ariaLabel?: string;
  className?: string;
};

/**
 * Trail of links ending in the current page (aria-current). Below sm the
 * middle crumbs are visually collapsed to an ellipsis but stay in the
 * DOM, so readers and find-in-page still see the whole trail. Server-safe.
 */
export function Breadcrumbs({ items, ariaLabel, className }: Props) {
  const t = useTranslations("ui");
  const last = items.length - 1;
  return (
    <nav aria-label={ariaLabel ?? t("breadcrumb")} className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-3">
        {items.map((item, i) => {
          const isLast = i === last;
          const middle = i > 0 && !isLast;
          return (
            <li
              key={`${i}-${item.label}`}
              className={clsx("flex min-w-0 items-center gap-1", middle ? "hidden sm:flex" : "flex")}
            >
              {i > 0 && <ChevronRight size={12} className="shrink-0" aria-hidden />}
              {item.href && !isLast ? (
                <Link href={item.href} className="truncate rounded-sm transition-colors hover:text-ink">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={clsx("truncate", isLast && "font-medium text-ink")}
                >
                  {item.label}
                </span>
              )}
              {/* Phone-only ellipsis standing in for the collapsed middle crumbs. */}
              {i === 0 && items.length > 2 && (
                <span className="flex items-center gap-1 sm:hidden" aria-hidden>
                  <ChevronRight size={12} className="shrink-0" />
                  <span className="px-0.5">…</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

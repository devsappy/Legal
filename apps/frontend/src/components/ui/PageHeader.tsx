import clsx from "clsx";
import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

type Props = {
  title: string;
  description?: string;
  /** Small mono line above the title: a section number, a status word. */
  eyebrow?: ReactNode;
  /** Item count shown after the title in mono, Latin digits in every locale. */
  count?: number;
  /** Buttons on the right; they wrap under the title on phones. */
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  /** Translated accessible name for the breadcrumb nav (e.g. t('breadcrumb')). */
  breadcrumbsLabel?: string;
  /** A <Tabs> row rendered flush under the header. */
  tabs?: ReactNode;
  className?: string;
};

/** The h1 block at the top of every app page. Server-safe. */
export function PageHeader({
  title,
  description,
  eyebrow,
  count,
  actions,
  breadcrumbs,
  breadcrumbsLabel,
  tabs,
  className,
}: Props) {
  const locale = useLocale();
  const formatted =
    count === undefined ? null : new Intl.NumberFormat(locale, { numberingSystem: "latn" }).format(count);

  return (
    <header className={clsx("flex flex-col gap-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} ariaLabel={breadcrumbsLabel} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1.5 font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{eyebrow}</div>}
          <h1 className="flex flex-wrap items-baseline gap-x-2.5 text-2xl font-medium text-ink">
            <span className="min-w-0 break-words">{title}</span>
            {formatted !== null && (
              <span className="font-mono text-sm font-normal tabular-nums tracking-normal text-ink-3">{formatted}</span>
            )}
          </h1>
          {description && <p className="mt-1.5 max-w-[60ch] text-sm text-ink-2">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs}
    </header>
  );
}

import clsx from "clsx";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "./Skeleton";

type Props = {
  /** 11px uppercase caption. */
  label: string;
  /** Pre-formatted (locale, 'latn' digits) — pass '—' when the number is unknown. */
  value: ReactNode;
  /** Small line under the value: a delta, a period, a unit. */
  sub?: ReactNode;
  icon?: ReactNode;
  /** Makes the whole tile a link. */
  href?: string;
  /** Swaps the value for a skeleton. */
  loading?: boolean;
  className?: string;
};

/**
 * A metric tile. Borderless on purpose: drop it into a `gap-px
 * bg-rule-strong` grid (the landing's hairline language) or inside a Card.
 * Server-safe; href renders a next-intl Link.
 */
export function Stat({ label, value, sub, icon, href, loading, className }: Props) {
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{label}</span>
        {icon ? (
          <span className="shrink-0 text-ink-3" aria-hidden>
            {icon}
          </span>
        ) : (
          href && (
            <ArrowUpRight
              size={14}
              className="shrink-0 text-ink-3 transition-transform motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none group-hover/stat:translate-x-px group-hover/stat:-translate-y-px"
              aria-hidden
            />
          )
        )}
      </span>
      <span className="mt-1.5 block text-2xl font-medium leading-none tracking-tight text-ink tabular-nums" aria-busy={loading || undefined}>
        {loading ? <Skeleton className="h-6 w-16" /> : value}
      </span>
      {sub && <span className="mt-1.5 block text-xs text-ink-2">{sub}</span>}
    </>
  );

  const base = clsx("flex min-w-0 flex-col bg-sheet p-4 text-left", className);

  if (href) {
    return (
      <Link href={href} className={clsx(base, "group/stat transition-colors hover:bg-muted/40")}>
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}

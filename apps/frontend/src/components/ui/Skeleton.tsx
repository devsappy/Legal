import clsx from "clsx";

/*
 * Loading placeholders. Solid bg-muted blocks with the global `.skeleton`
 * opacity pulse (globals.css; static under reduced motion). All of them
 * are aria-hidden: the surrounding region should carry aria-busy or a
 * status line instead of announcing every grey bar. Server-safe.
 */

export function Skeleton({ className }: { className?: string }) {
  return <span className={clsx("skeleton block rounded-md bg-muted", className)} data-motion aria-hidden />;
}

/* Lines of text; the last line is shorter, like a real paragraph. */
const LINE_WIDTHS = ["w-full", "w-11/12", "w-4/5", "w-9/12", "w-3/5"];

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const count = Math.max(1, lines);
  return (
    <span className={clsx("flex flex-col gap-2", className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          className={clsx("h-3.5", i === count - 1 ? "w-3/5" : LINE_WIDTHS[i % LINE_WIDTHS.length])}
        />
      ))}
    </span>
  );
}

/* Table rows: a hairline-separated list with one bar per column. */
export function SkeletonRows({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <span className={clsx("flex flex-col divide-y divide-rule", className)} aria-hidden>
      {Array.from({ length: Math.max(1, rows) }, (_, r) => (
        <span key={r} className="flex items-center gap-4 px-3 py-3">
          {Array.from({ length: Math.max(1, cols) }, (_, c) => (
            <Skeleton
              key={c}
              className={clsx("h-3.5", c === 0 ? "w-2/5" : c === cols - 1 ? "ml-auto w-12" : "w-1/5")}
            />
          ))}
        </span>
      ))}
    </span>
  );
}

/* A card outline with a title line and a short paragraph. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <span className={clsx("block rounded-lg border border-rule bg-sheet p-4 sm:p-5", className)} aria-hidden>
      <Skeleton className="mb-3 h-4 w-1/3" />
      <SkeletonText lines={3} />
    </span>
  );
}

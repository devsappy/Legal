import clsx from "clsx";

type Props = {
  /** 0..1; clamped. */
  value: number;
  /** Below this the fill turns seal (e.g. a citation confidence floor). */
  threshold?: number;
  /** Accessible name; shown as a caption when showValue is on. */
  label: string;
  /** Renders a caption row: label on the left, percentage on the right. */
  showValue?: boolean;
  className?: string;
};

/**
 * A thin horizontal meter. The fill is scaled with a transform (not a
 * width transition) so the only animated property is transform, and it
 * stays still under reduced motion. Server-safe.
 */
export function Meter({ value, threshold, label, showValue, className }: Props) {
  const v = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const pct = Math.round(v * 100);
  const low = threshold !== undefined && v < threshold;

  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      {showValue && (
        <span className="flex items-baseline justify-between gap-3 text-xs">
          <span className="truncate text-ink-2">{label}</span>
          <span className={clsx("shrink-0 font-mono tabular-nums", low ? "text-seal" : "text-ink-2")}>{pct}%</span>
        </span>
      )}
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct}%`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-rule"
      >
        <div
          className={clsx(
            "h-full w-full origin-left rounded-full transition-transform duration-(--dur-3) ease-(--ease-standard) motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none",
            low ? "bg-seal" : "bg-ink",
          )}
          style={{ transform: `scaleX(${v})` }}
          data-motion
        />
      </div>
    </div>
  );
}

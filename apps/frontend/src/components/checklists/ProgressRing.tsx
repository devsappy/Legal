import clsx from "clsx";

type Props = {
  done: number;
  total: number;
  /** Outer diameter in px. */
  size?: number;
  /** Accessible name; the ring itself is a meter. */
  label: string;
  className?: string;
};

/**
 * Ink arc on a rule track with "n/N" in mono beside it. Static (no
 * stroke animation: only opacity and transform ever move here). Server-safe.
 */
export function ProgressRing({ done, total, size = 36, label, className }: Props) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  const complete = total > 0 && done >= total;

  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done}/${total}`}
        className="shrink-0 -rotate-90"
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-rule" />
        {ratio > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - ratio)}
            className="text-ink"
          />
        )}
      </svg>
      <span className={clsx("font-mono text-xs tabular-nums", complete ? "text-ink" : "text-ink-2")} aria-hidden>
        {done}/{total}
      </span>
    </span>
  );
}

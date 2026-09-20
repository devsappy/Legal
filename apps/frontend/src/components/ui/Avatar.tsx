import clsx from "clsx";

type Props = {
  name: string;
  /** 24 / 28 / 36 px. */
  size?: "sm" | "md" | "lg";
  /** Bottom-right dot: ink (ok), hollow (degraded), seal (down). */
  status?: "ok" | "degraded" | "down";
  className?: string;
};

/*
 * First grapheme of up to two words. Devanagari and Tamil letters are
 * often several code points (base + vowel sign), so a naive charAt would
 * cut a syllable in half; Intl.Segmenter keeps it whole. Older engines
 * without Segmenter fall back to code points, which is still better than
 * UTF-16 units.
 */
function firstGrapheme(word: string): string {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const it = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word)[Symbol.iterator]();
    const first = it.next();
    return first.done ? "" : first.value.segment;
  }
  return Array.from(word)[0] ?? "";
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const picked = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]];
  return picked.map(firstGrapheme).join("").toLocaleUpperCase();
}

const SIZES = {
  sm: "size-6 text-2xs",
  md: "size-7 text-xs",
  lg: "size-9 text-sm",
} as const;

const DOT = {
  ok: "bg-ink",
  degraded: "border border-ink bg-sheet",
  down: "bg-seal",
} as const;

/** Initials tile. The status dot is decorative; put the status in text nearby. Server-safe. */
export function Avatar({ name, size = "md", status, className }: Props) {
  return (
    <span
      role="img"
      aria-label={name}
      className={clsx(
        "relative inline-flex shrink-0 select-none items-center justify-center rounded-full bg-brand-soft font-medium text-ink ring-1 ring-rule",
        SIZES[size],
        className,
      )}
    >
      <span aria-hidden>{initialsOf(name)}</span>
      {status && (
        <span
          className={clsx(
            "absolute -right-px -bottom-px rounded-full ring-2 ring-sheet",
            size === "lg" ? "size-2.5" : "size-2",
            DOT[status],
          )}
          aria-hidden
        />
      )}
    </span>
  );
}

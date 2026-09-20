import clsx from "clsx";
import type { ReactNode } from "react";

export type BadgeKind = "neutral" | "solid" | "soft" | "warn" | "bad" | "verified";

type Props = {
  kind?: BadgeKind;
  /** Leading status dot (hollow for warn). */
  dot?: boolean;
  /** Mono face for codes, section numbers, ids. */
  mono?: boolean;
  className?: string;
  children: ReactNode;
};

/*
 * Colour rules: `bad` is the only seal badge (errors, escalation, down) and
 * `verified` the only green one (verified citations). Everything else is
 * ink on paper. Inverted `solid` uses the ink/paper pair so dark mode flips.
 */
const KINDS: Record<BadgeKind, string> = {
  neutral: "border border-rule text-ink-2",
  solid: "bg-ink text-paper",
  soft: "bg-muted text-ink-2",
  warn: "bg-brand-soft text-ink",
  bad: "bg-seal-soft text-seal",
  verified: "bg-verified-soft text-verified",
};

const DOTS: Record<BadgeKind, string> = {
  neutral: "bg-ink-3",
  solid: "bg-paper",
  soft: "bg-ink-2",
  warn: "border border-ink bg-transparent",
  bad: "bg-seal",
  verified: "bg-verified",
};

/** Small status pill: 20px tall, 11px, rounded-full. Server-safe. */
export function Badge({ kind = "neutral", dot, mono, className, children }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-2xs font-medium leading-none",
        mono ? "font-mono tracking-wide" : "font-sans",
        KINDS[kind],
        className,
      )}
    >
      {dot && <span className={clsx("size-1.5 shrink-0 rounded-full", DOTS[kind])} aria-hidden />}
      {children}
    </span>
  );
}

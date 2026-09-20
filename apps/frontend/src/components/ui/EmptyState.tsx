import clsx from "clsx";
import type { ReactNode } from "react";
import { Inbox, TriangleAlert } from "lucide-react";

type Props = {
  /** 16–20px glyph; defaults to an inbox, or a warning triangle for tone='error'. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Primary call to action, e.g. a Retry button. */
  action?: ReactNode;
  /** A quieter second option: a link back, a docs pointer. */
  secondary?: ReactNode;
  /** Tighter padding for use inside tables and panels. */
  compact?: boolean;
  /** 'error' colours the icon seal; use it for failed fetches, not for 'nothing here yet'. */
  tone?: "neutral" | "error";
  className?: string;
};

/**
 * Centred placeholder for empty lists and failed loads. Server pages
 * render this (tone='error' + a Retry action) when the backend is down,
 * never a blank page. Server-safe.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondary,
  compact,
  tone = "neutral",
  className,
}: Props) {
  const glyph =
    icon ?? (tone === "error" ? <TriangleAlert size={18} strokeWidth={1.75} /> : <Inbox size={18} strokeWidth={1.75} />);
  return (
    <div
      className={clsx(
        "flex flex-col items-center px-4 text-center",
        compact ? "py-6" : "py-12 sm:py-16",
        className,
      )}
    >
      <span
        className={clsx(
          "flex size-10 items-center justify-center rounded-lg bg-muted",
          tone === "error" ? "text-seal" : "text-ink-2",
        )}
        aria-hidden
      >
        {glyph}
      </span>
      <p className="mt-3 text-base font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-[40ch] text-sm text-ink-2">{description}</p>}
      {(action || secondary) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
}

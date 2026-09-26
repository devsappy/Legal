import clsx from "clsx";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** Forwarded to the <input> (not the wrapper): focus(), initialFocusRef. */
  ref?: Ref<HTMLInputElement>;
  /** Leading glyph, 14–16px, rendered inside the field. */
  icon?: ReactNode;
  /** Trailing content: a Kbd hint, a clear button, a unit. */
  trailing?: ReactNode;
  /** Seal border + aria-invalid. Field passes aria-invalid too; either works. */
  invalid?: boolean;
  /** h-8 or h-9. */
  size?: "sm" | "md";
};

/**
 * Text field on the sheet. The wrapper is always rendered so `className`
 * lands in one place (the wrapper) whether or not adornments are present;
 * the wrapper is a flex item, so width utilities (w-full, max-w-sm) apply
 * to it. Server-safe.
 */
export function Input({ icon, trailing, invalid, size = "md", className, ...rest }: Props) {
  const sm = size === "sm";
  return (
    <span className={clsx("relative inline-flex w-full", className)}>
      {icon && (
        <span
          className={clsx(
            "pointer-events-none absolute top-1/2 flex -translate-y-1/2 text-ink-3",
            sm ? "left-2.5" : "left-3",
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}
      <input
        {...rest}
        aria-invalid={invalid || rest["aria-invalid"] || undefined}
        className={clsx(
          "w-full min-w-0 rounded-lg border bg-sheet text-ink placeholder:text-ink-3 outline-none transition-colors",
          "hover:border-rule-strong focus:border-brand/60 disabled:cursor-not-allowed disabled:opacity-45",
          /* 16px below sm: anything smaller makes iOS Safari zoom the page on focus. */
          "text-[16px]",
          sm ? "h-8 sm:text-xs" : "h-9 sm:text-sm",
          icon ? (sm ? "pl-8" : "pl-9") : sm ? "pl-2.5" : "pl-3",
          trailing ? (sm ? "pr-8" : "pr-9") : sm ? "pr-2.5" : "pr-3",
          invalid ? "border-seal/60 hover:border-seal/60" : "border-rule",
        )}
      />
      {trailing && (
        <span
          className={clsx(
            "absolute top-1/2 flex -translate-y-1/2 items-center text-ink-3",
            sm ? "right-2" : "right-2.5",
          )}
        >
          {trailing}
        </span>
      )}
    </span>
  );
}

"use client";

import { useEffect, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { Check, Minus } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Tri-state header checkbox in tables. A DOM property, so it is set in an effect. */
  indeterminate?: boolean;
  /** Wraps the box in a <label>; without it pass aria-label. */
  label?: ReactNode;
};

/**
 * A native checkbox (keyboard, forms, screen readers for free) with a
 * custom 16px box drawn over it. The glyph is a sibling driven by
 * peer-checked / peer-indeterminate, so no JS state is duplicated.
 */
export function Checkbox({ indeterminate = false, label, className, disabled, ...rest }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const box = (
    <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled}
        {...rest}
        className={clsx(
          "peer size-4 cursor-pointer appearance-none rounded-[4px] border border-rule-strong bg-sheet accent-ink transition-colors",
          "hover:border-ink checked:border-ink checked:bg-ink indeterminate:border-ink indeterminate:bg-ink",
          "disabled:cursor-not-allowed disabled:opacity-45",
          !label && className,
        )}
      />
      <Check
        size={12}
        strokeWidth={3}
        className="pointer-events-none absolute hidden text-paper peer-[:checked:not(:indeterminate)]:block"
        aria-hidden
      />
      <Minus
        size={12}
        strokeWidth={3}
        className="pointer-events-none absolute hidden text-paper peer-indeterminate:block"
        aria-hidden
      />
    </span>
  );

  if (!label) return box;
  return (
    <label
      className={clsx(
        "inline-flex cursor-pointer items-start gap-2 text-sm text-ink",
        disabled && "cursor-not-allowed opacity-70",
        className,
      )}
    >
      {box}
      <span className="min-w-0 leading-4">{label}</span>
    </label>
  );
}

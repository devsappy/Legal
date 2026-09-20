import clsx from "clsx";
import type { ReactNode } from "react";

/** Attributes Field wires up for its control. Spread them onto the input. */
export type FieldA11y = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

type Props = {
  /** The control's id; hint and error ids derive from it. */
  id: string;
  label: string;
  hint?: string;
  /** Shown in seal below the control and announced (role=alert). */
  error?: string;
  required?: boolean;
  className?: string;
  /**
   * Render prop receiving the wired ids. A plain node is also accepted for
   * controls that manage their own attributes.
   */
  children: ReactNode | ((a11y: FieldA11y) => ReactNode);
};

/**
 * Label + control + hint + error, with the aria wiring done once. The
 * label is bound with htmlFor, so clicking it focuses the control.
 * Server-safe.
 */
export function Field({ id, label, hint, error, required, className, children }: Props) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;
  const a11y: FieldA11y = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  };

  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-2">
        {label}
        {required && (
          <span className="ml-0.5 text-ink-3" aria-hidden>
            *
          </span>
        )}
      </label>
      {typeof children === "function" ? children(a11y) : children}
      {hint && (
        <p id={hintId} className="text-xs text-ink-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-seal">
          {error}
        </p>
      )}
    </div>
  );
}

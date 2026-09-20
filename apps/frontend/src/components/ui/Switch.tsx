"use client";

import { useId } from "react";
import clsx from "clsx";

type Props = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible label to the left of the track; clicking it toggles. */
  label: string;
  /** Second line under the label, wired as the description. */
  description?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * A settings-row toggle: label and description on the left, the track on
 * the right. role=switch on a real <button>, so Space/Enter and the label
 * click both toggle. The track is ink when on and the thumb is paper, so
 * dark mode flips both. Only the thumb's transform animates.
 */
export function Switch({ id, checked, onCheckedChange, label, description, disabled, className }: Props) {
  const auto = useId();
  const switchId = id ?? auto;
  const descId = `${switchId}-desc`;

  return (
    <div className={clsx("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <label
          htmlFor={switchId}
          className={clsx("block text-sm font-medium text-ink", disabled ? "cursor-not-allowed" : "cursor-pointer")}
        >
          {label}
        </label>
        {description && (
          <p id={descId} className="mt-0.5 text-xs text-ink-2">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={clsx(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent p-px transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-45",
          checked ? "bg-ink" : "bg-rule-strong hover:bg-ink-3",
        )}
      >
        <span
          className={clsx(
            "block size-4 rounded-full bg-paper shadow-raised transition-transform duration-(--dur-2) ease-(--ease-standard) motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none",
            checked ? "translate-x-4" : "translate-x-0",
          )}
          data-motion
          aria-hidden
        />
      </button>
    </div>
  );
}

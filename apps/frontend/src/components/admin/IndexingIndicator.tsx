"use client";

import { LatticeLoader } from "@/components/reactbits";

type Props = {
  label: string;
  doneLabel?: string;
  errorLabel?: string;
  status?: "working" | "done" | "error";
  /** Shows the loader's own elapsed clock next to the label. */
  showTimer?: boolean;
  className?: string;
};

/**
 * Live indicator for a document being chunked and embedded, or an index
 * being rebuilt: the vendored LatticeLoader in token colours (ink while
 * working and when done, seal on error — green stays reserved for citations).
 */
export function IndexingIndicator({ label, doneLabel, errorLabel, status = "working", showTimer = false, className }: Props) {
  return (
    <LatticeLoader
      status={status}
      label={label}
      doneLabel={doneLabel ?? label}
      errorLabel={errorLabel ?? label}
      pattern="snake"
      grid={3}
      shape="square"
      cellSize={4}
      gap={2}
      fontSize={12.5}
      color="var(--ink)"
      doneColor="var(--ink)"
      errorColor="var(--seal)"
      showTimer={showTimer}
      className={className}
    />
  );
}

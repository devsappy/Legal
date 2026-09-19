"use client";

import { LatticeLoader } from "@/components/reactbits";

/** Live indicator for a document still being chunked and embedded. */
export function IndexingIndicator({ label }: { label: string }) {
  return (
    <LatticeLoader
      status="working"
      label={label}
      pattern="snake"
      grid={3}
      shape="square"
      cellSize={4}
      gap={2}
      fontSize={12}
      color="var(--violet)"
      doneColor="var(--verified)"
      errorColor="var(--seal)"
      showTimer={false}
    />
  );
}

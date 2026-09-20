"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../Button";
import { Select } from "../Select";
import type { DataTableLabels } from "./types";

type Props = {
  labels: DataTableLabels;
  page: number;
  size: number;
  total: number;
  pageSizes: number[];
  onPage: (page: number) => void;
  onSize: (size: number) => void;
};

/**
 * "1–25 of 132" with previous/next and a page-size pill. The range is a
 * polite live region so a screen reader hears the new window after paging,
 * and the size change is announced through the same text.
 */
export function Pagination({ labels, page, size, total, pageSizes, onPage, onSize }: Props) {
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const options = pageSizes.map((n) => ({ value: String(n), label: String(n) }));
  // A size not in the list (from a persisted preference) still shows up.
  if (!pageSizes.includes(size)) options.push({ value: String(size), label: String(size) });

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-2">
      <label className="flex items-center gap-2">
        <span>{labels.rowsPerPage}</span>
        <Select
          size="sm"
          options={options}
          value={String(size)}
          onChange={(e) => onSize(Number(e.target.value))}
          className="w-[76px]"
        />
      </label>
      <p aria-live="polite" className="font-mono tabular-nums text-ink-2">
        {labels.pageOf(from, to, total)}
      </p>
      <div className="ml-auto flex items-center gap-1">
        <Button size="icon-sm" variant="ghost" aria-label={labels.previous} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={15} aria-hidden />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label={labels.next} disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <ChevronRight size={15} aria-hidden />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useRef, type ReactNode } from "react";
import clsx from "clsx";
import { ChevronDown, ListFilter, Search, X } from "lucide-react";
import { useHotkey } from "@/hooks/useHotkey";
import { Button } from "../Button";
import { Input } from "../Input";
import { DropdownMenu, MenuCheckboxItem, MenuLabel } from "../DropdownMenu";
import type { DataTableLabels, FilterDef, TableState } from "./types";

type Props<T> = {
  labels: DataTableLabels;
  state: TableState;
  patch: (p: Partial<TableState>) => void;
  search?: { placeholder?: string; test: (row: T, q: string) => boolean };
  filters?: FilterDef<T>[];
  /** Rows left after search and filters, for the live count. */
  total: number;
  actions?: ReactNode;
};

/**
 * Search field ("/" focuses it from anywhere on the page), one checkbox menu
 * per FilterDef, the active values as removable chips, the live count and a
 * clear-all link. Any change resets to page 1.
 */
export function Toolbar<T>({ labels, state, patch, search, filters, total, actions }: Props<T>) {
  const wrap = useRef<HTMLDivElement>(null);

  useHotkey("/", () => wrap.current?.querySelector("input")?.focus(), {
    id: "table.search",
    scope: "table",
    label: labels.search,
    enabled: Boolean(search),
  });

  const chips = (filters ?? []).flatMap((f) =>
    (state.filters[f.id] ?? []).map((value) => ({
      filterId: f.id,
      value,
      label: `${f.label}: ${f.options.find((o) => o.value === value)?.label ?? value}`,
    })),
  );
  const dirty = Boolean(state.q) || chips.length > 0;

  const setFilter = (id: string, values: string[]) => patch({ filters: { ...state.filters, [id]: values }, page: 1 });

  if (!search && !filters?.length && !actions) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {search && (
          <div ref={wrap} className="w-full sm:w-[260px]">
            <Input
              type="search"
              size="sm"
              aria-label={labels.search}
              placeholder={search.placeholder ?? labels.search}
              value={state.q}
              onChange={(e) => patch({ q: e.target.value, page: 1 })}
              onKeyDown={(e) => {
                if (e.key === "Escape" && state.q) {
                  e.preventDefault();
                  patch({ q: "", page: 1 });
                }
              }}
              icon={<Search size={14} strokeWidth={2} />}
              trailing={
                state.q ? (
                  <button
                    type="button"
                    aria-label={labels.clear}
                    onClick={() => patch({ q: "", page: 1 })}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-muted hover:text-ink"
                  >
                    <X size={13} aria-hidden />
                  </button>
                ) : undefined
              }
              className="[&_input::-webkit-search-cancel-button]:hidden"
            />
          </div>
        )}

        {filters?.map((f) => {
          const active = state.filters[f.id] ?? [];
          return (
            <DropdownMenu
              key={f.id}
              label={f.label}
              trigger={
                <Button size="sm" variant="outline" className={clsx("gap-1.5", active.length > 0 && "border-rule-strong bg-muted")}>
                  <ListFilter size={13} aria-hidden className="text-ink-3" />
                  {f.label}
                  {active.length > 0 && (
                    <span className="rounded-full bg-ink px-1.5 font-mono text-2xs leading-4 text-paper">{active.length}</span>
                  )}
                  <ChevronDown size={13} aria-hidden className="text-ink-3" />
                </Button>
              }
            >
              <MenuLabel>{f.label}</MenuLabel>
              {f.options.map((o) => (
                <MenuCheckboxItem
                  key={o.value}
                  checked={active.includes(o.value)}
                  onCheckedChange={(on) =>
                    setFilter(f.id, on ? [...active, o.value] : active.filter((v) => v !== o.value))
                  }
                >
                  {o.label}
                </MenuCheckboxItem>
              ))}
            </DropdownMenu>
          );
        })}

        {labels.results && (
          <span className="text-xs text-ink-3 tabular-nums">{labels.results(total)}</span>
        )}

        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <span
              key={`${c.filterId}:${c.value}`}
              className="inline-flex h-6 items-center gap-1 rounded-full border border-rule bg-sheet pl-2.5 pr-1 text-xs text-ink"
            >
              {c.label}
              <button
                type="button"
                aria-label={labels.removeFilter ? labels.removeFilter(c.label) : `${labels.clear}: ${c.label}`}
                onClick={() =>
                  setFilter(
                    c.filterId,
                    (state.filters[c.filterId] ?? []).filter((v) => v !== c.value),
                  )
                }
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-muted hover:text-ink"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          ))}
          {dirty && (
            <Button size="xs" variant="link" onClick={() => patch({ q: "", filters: {}, page: 1 })}>
              {labels.clearFilters}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import {
  Fragment,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import clsx from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import { EmptyState } from "../EmptyState";
import { SkeletonRows } from "../Skeleton";
import { BulkBar } from "./BulkBar";
import { Pagination } from "./Pagination";
import { Toolbar } from "./Toolbar";
import { useTableState } from "./useTableState";
import { tableLabels, type ColumnDef, type DataTableProps, type TableState } from "./types";

const DEFAULT_SIZES = [25, 50, 100];

/** Controls inside a row take the click; the row itself only opens on the gaps. */
const ROW_CONTROLS = "a,button,input,select,textarea,label,summary,[role='menuitem'],[data-no-row-click]";

function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function hideClass<T>(c: ColumnDef<T>): string | undefined {
  return c.hideBelow === "sm" ? "max-sm:hidden" : c.hideBelow === "md" ? "max-md:hidden" : undefined;
}

/**
 * Client-side table for a few hundred rows: search, filters, sort, paging,
 * selection with bulk actions, keyboard rows, and cards on phones. State is
 * either owned (useTableState inside) or controlled through `state` +
 * `onStateChange`, which is how ?q=&sort=&page= URL sync is switched on:
 *
 *   const [state, patch] = useTableState({ syncUrl: true });
 *   <DataTable state={state} onStateChange={patch} … />
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const {
    columns,
    rows,
    rowKey,
    caption,
    search,
    filters,
    groupBy,
    selectable,
    bulkActions,
    onRowClick,
    pageSizes = DEFAULT_SIZES,
    loading,
    empty,
    stickyHeader,
    mobileLayout = "cards",
    toolbarActions,
    density = "comfortable",
    className,
  } = props;

  const uid = useId();
  // Strings come from the `ui` namespace unless the page overrides them.
  const t = useTranslations("ui");
  const locale = useLocale();
  const overrides = props.labels;
  const labels = useMemo(() => tableLabels(t, overrides, locale), [t, overrides, locale]);
  const [ownState, ownPatch] = useTableState({ defaultSize: pageSizes[0] });
  const state: TableState = props.state ?? ownState;
  const patch = props.onStateChange ?? ownPatch;

  /* ---- search → filters → sort → group → page ---------------------------- */

  const q = state.q.trim().toLowerCase();
  const filtered = useMemo(() => {
    let out = rows;
    if (search && q) out = out.filter((r) => search.test(r, q));
    for (const f of filters ?? []) {
      const values = state.filters[f.id];
      if (values?.length) out = out.filter((r) => f.test(r, values));
    }
    return out;
  }, [rows, search, q, filters, state.filters]);

  const sortCol = state.sort ? columns.find((c) => c.id === state.sort && c.sortValue) : undefined;
  const sorted = useMemo(() => {
    const get = sortCol?.sortValue;
    if (!get) return filtered;
    const sign = state.dir === "desc" ? -1 : 1;
    // Stable: equal keys keep their incoming order.
    return filtered
      .map((r, i) => ({ r, i, v: get(r) }))
      .sort((a, b) => compare(a.v, b.v) * sign || a.i - b.i)
      .map((x) => x.r);
  }, [filtered, sortCol, state.dir]);

  const ordered = useMemo(() => {
    if (!groupBy) return sorted;
    const groups = new Map<string, T[]>();
    for (const r of sorted) {
      const k = groupBy(r);
      const list = groups.get(k);
      if (list) list.push(r);
      else groups.set(k, [r]);
    }
    return Array.from(groups.values()).flat();
  }, [sorted, groupBy]);

  const total = ordered.length;
  const pages = Math.max(1, Math.ceil(total / state.size));
  // Clamp rather than write back, so a shrinking result set never loops.
  const page = Math.min(Math.max(1, state.page), pages);
  const pageRows = useMemo(() => ordered.slice((page - 1) * state.size, page * state.size), [ordered, page, state.size]);

  const cycleSort = (id: string) => {
    if (state.sort !== id) patch({ sort: id, dir: "asc", page: 1 });
    else if (state.dir === "asc") patch({ dir: "desc", page: 1 });
    else patch({ sort: null, dir: "asc", page: 1 });
  };
  const clearAll = () => patch({ q: "", filters: {}, page: 1 });

  /* ---- selection --------------------------------------------------------- */

  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const lastPicked = useRef<number | null>(null);
  const shiftHeld = useRef(false);
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const selectedRows = useMemo(
    () => (selected.size ? rows.filter((r) => selected.has(rowKey(r))) : []),
    [rows, selected, rowKey],
  );
  const indexOf = useMemo(() => new Map(ordered.map((r, i) => [rowKey(r), i])), [ordered, rowKey]);

  const toggleRow = (row: T, shift: boolean) => {
    const key = rowKey(row);
    const idx = indexOf.get(key) ?? 0;
    const anchor = lastPicked.current;
    setSelected((prev) => {
      const next = new Set(prev);
      if (shift && anchor !== null) {
        // Shift-click: the whole span between the last pick and this row
        // takes this row's new state.
        const on = !prev.has(key);
        for (let i = Math.min(anchor, idx); i <= Math.max(anchor, idx); i++) {
          const k = rowKey(ordered[i]);
          if (on) next.add(k);
          else next.delete(k);
        }
      } else if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    lastPicked.current = idx;
  };

  const pageKeys = pageRows.map(rowKey);
  const allOnPage = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
  const someOnPage = !allOnPage && pageKeys.some((k) => selected.has(k));
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of pageKeys) {
        if (allOnPage) next.delete(k);
        else next.add(k);
      }
      return next;
    });

  /* ---- keyboard rows ----------------------------------------------------- */

  const interactive = Boolean(onRowClick || selectable);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // One tab stop per list: the last focused row if it is still on the page, else the first.
  const tabStop = activeKey !== null && pageKeys.includes(activeKey) ? activeKey : pageKeys[0];

  const onRowKeyDown = (e: KeyboardEvent<HTMLElement>, row: T) => {
    if (e.target !== e.currentTarget) return; // a control inside the row has focus
    const siblings = Array.from(e.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[data-row]") ?? []);
    const i = siblings.indexOf(e.currentTarget);
    const go = (to: number) => siblings[Math.min(Math.max(to, 0), siblings.length - 1)]?.focus();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        go(i + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        go(i - 1);
        break;
      case "Home":
        e.preventDefault();
        go(0);
        break;
      case "End":
        e.preventDefault();
        go(siblings.length - 1);
        break;
      case "Enter":
        if (onRowClick) {
          e.preventDefault();
          onRowClick(row);
        }
        break;
      case " ":
        if (selectable) {
          e.preventDefault();
          toggleRow(row, e.shiftKey);
        }
        break;
    }
  };
  const handleRowClick = (e: MouseEvent<HTMLElement>, row: T) => {
    if (!onRowClick || (e.target as Element).closest(ROW_CONTROLS)) return;
    onRowClick(row);
  };
  const rowProps = (row: T, key: string) =>
    interactive
      ? {
          tabIndex: key === tabStop ? 0 : -1,
          onKeyDown: (e: KeyboardEvent<HTMLElement>) => onRowKeyDown(e, row),
          onFocus: (e: FocusEvent<HTMLElement>) => {
            if (e.target === e.currentTarget) setActiveKey(key);
          },
          onClick: (e: MouseEvent<HTMLElement>) => handleRowClick(e, row),
        }
      : {};

  /* ---- render ------------------------------------------------------------ */

  const pad = density === "compact" ? "px-3 py-1.5" : "px-3 py-2.5";
  const cardsBelowSm = mobileLayout === "cards";
  const colCount = columns.length + (selectable ? 1 : 0);
  const dirty = Boolean(state.q) || Object.values(state.filters).some((v) => v.length > 0);

  const rowCheckbox = (row: T, key: string, titleId: string) => (
    <Checkbox
      checked={selected.has(key)}
      aria-labelledby={titleId}
      onClick={(e) => {
        shiftHeld.current = e.shiftKey;
      }}
      onChange={() => toggleRow(row, shiftHeld.current)}
    />
  );

  let body: ReactNode;
  if (loading) {
    body = (
      <div className="rounded-lg border border-rule bg-sheet p-2" aria-busy="true">
        <span className="sr-only" role="status">
          {labels.loading}
        </span>
        <SkeletonRows rows={Math.min(state.size, 8)} cols={Math.min(colCount, 5)} />
      </div>
    );
  } else if (rows.length === 0) {
    body = (
      <div className="rounded-lg border border-dashed border-rule-strong">
        <EmptyState compact icon={empty.icon} title={empty.title} description={empty.description} action={empty.action} />
      </div>
    );
  } else if (total === 0) {
    body = (
      <div className="rounded-lg border border-dashed border-rule-strong">
        <EmptyState
          compact
          icon={<SearchX size={18} strokeWidth={1.75} />}
          title={labels.noResults}
          action={
            dirty ? (
              <Button size="sm" variant="outline" onClick={clearAll}>
                {labels.clearFilters}
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  } else {
    body = (
      <>
        {/* Table: hidden below sm when cards take over. */}
        <div
          className={clsx(
            // `relative` keeps sr-only cell content (absolutely positioned) inside the scroll box.
            "relative rounded-lg border border-rule bg-sheet",
            cardsBelowSm ? "hidden sm:block" : "block",
            stickyHeader ? "scroll-thin max-h-[60vh] overflow-auto" : "overflow-x-auto",
          )}
        >
          <table className="w-full text-sm">
            <caption className="sr-only">{caption}</caption>
            <colgroup>
              {selectable && <col style={{ width: "44px" }} />}
              {columns.map((c) => (
                <col key={c.id} className={hideClass(c)} style={c.width ? { width: c.width } : undefined} />
              ))}
            </colgroup>
            <thead className={clsx(stickyHeader && "sticky top-0 z-(--z-sticky) bg-sheet")}>
              <tr className="border-b border-rule text-left text-2xs uppercase tracking-[0.08em] text-ink-3">
                {selectable && (
                  <th scope="col" className="px-3 py-2" onMouseDown={(e) => e.shiftKey && e.preventDefault()}>
                    <Checkbox aria-label={labels.selectAll} checked={allOnPage} indeterminate={someOnPage} onChange={togglePage} />
                  </th>
                )}
                {columns.map((c) => {
                  const sortedHere = state.sort === c.id && Boolean(sortCol);
                  return (
                    <th
                      key={c.id}
                      scope="col"
                      aria-sort={c.sortValue ? (sortedHere ? (state.dir === "asc" ? "ascending" : "descending") : "none") : undefined}
                      className={clsx("whitespace-nowrap px-3 py-2 font-medium", c.align === "right" && "text-right", hideClass(c))}
                    >
                      {c.sortValue ? (
                        <button
                          type="button"
                          onClick={() => cycleSort(c.id)}
                          className={clsx(
                            "-mx-1 inline-flex items-center gap-1 rounded-sm px-1 transition-colors hover:text-ink",
                            sortedHere && "text-ink",
                          )}
                        >
                          {c.header}
                          <span aria-hidden className={clsx(!sortedHere && "opacity-50")}>
                            {sortedHere ? state.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUpDown size={12} />}
                          </span>
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => {
                const key = rowKey(row);
                const titleId = `${uid}-r${i}`;
                const group = groupBy?.(row);
                const newGroup = groupBy && (i === 0 || groupBy(pageRows[i - 1]) !== group);
                return (
                  <Fragment key={key}>
                    {newGroup && (
                      <tr className="border-b border-rule bg-muted/40">
                        <th
                          scope="colgroup"
                          colSpan={colCount}
                          className="px-3 py-1.5 text-left text-2xs font-medium uppercase tracking-[0.08em] text-ink-2"
                        >
                          {group}
                        </th>
                      </tr>
                    )}
                    <tr
                      data-row
                      data-selected={selected.has(key) || undefined}
                      {...rowProps(row, key)}
                      className={clsx(
                        "border-b border-rule transition-colors last:border-b-0",
                        interactive && "cursor-pointer hover:bg-muted/60 focus-visible:-outline-offset-2",
                        selected.has(key) && "bg-muted/60",
                      )}
                    >
                      {selectable && (
                        <td className={clsx(pad, "align-top")} onMouseDown={(e) => e.shiftKey && e.preventDefault()}>
                          {rowCheckbox(row, key, titleId)}
                        </td>
                      )}
                      {columns.map((c, ci) => (
                        <td
                          key={c.id}
                          id={ci === 0 ? titleId : undefined}
                          className={clsx(
                            pad,
                            "align-top",
                            c.mono && "font-mono text-xs tabular-nums",
                            c.align === "right" && "text-right tabular-nums",
                            hideClass(c),
                          )}
                        >
                          {c.cell(row)}
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cards: the same rows as a definition list per row, below sm. */}
        {cardsBelowSm && (
          <ul className="flex flex-col gap-2 sm:hidden" aria-label={caption}>
            {pageRows.map((row, i) => {
              const key = rowKey(row);
              const titleId = `${uid}-c${i}`;
              const group = groupBy?.(row);
              const newGroup = groupBy && (i === 0 || groupBy(pageRows[i - 1]) !== group);
              const [first, ...rest] = columns;
              return (
                <Fragment key={key}>
                  {newGroup && (
                    <li className="px-1 pt-2 text-2xs font-medium uppercase tracking-[0.08em] text-ink-2 first:pt-0">{group}</li>
                  )}
                  <li
                    data-row
                    data-selected={selected.has(key) || undefined}
                    {...rowProps(row, key)}
                    className={clsx(
                      "rounded-lg border border-rule bg-sheet p-3 transition-colors",
                      interactive && "cursor-pointer hover:bg-muted/40 focus-visible:-outline-offset-2",
                      selected.has(key) && "border-rule-strong bg-muted/40",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {selectable && (
                        <span className="mt-0.5 shrink-0" onMouseDown={(e) => e.shiftKey && e.preventDefault()}>
                          {rowCheckbox(row, key, titleId)}
                        </span>
                      )}
                      <div id={titleId} className="min-w-0 flex-1 font-medium">
                        {first.cell(row)}
                      </div>
                    </div>
                    {rest.length > 0 && (
                      <dl className="mt-2 grid grid-cols-[minmax(0,max-content)_1fr] gap-x-3 gap-y-1 text-xs">
                        {rest.map((c) => (
                          <Fragment key={c.id}>
                            <dt className="text-ink-3">{c.mobileLabel ?? c.header}</dt>
                            <dd className={clsx("min-w-0 text-ink", c.mono && "font-mono tabular-nums", c.align === "right" && "text-right")}>
                              {c.cell(row)}
                            </dd>
                          </Fragment>
                        ))}
                      </dl>
                    )}
                  </li>
                </Fragment>
              );
            })}
          </ul>
        )}
      </>
    );
  }

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      <Toolbar labels={labels} state={state} patch={patch} search={search} filters={filters} total={total} actions={toolbarActions} />
      {body}
      {!loading && total > 0 && (
        <Pagination
          labels={labels}
          page={page}
          size={state.size}
          total={total}
          pageSizes={pageSizes}
          onPage={(p) => patch({ page: p })}
          onSize={(s) => patch({ size: s, page: 1 })}
        />
      )}
      {selectable && selectedRows.length > 0 && (
        <BulkBar labels={labels} count={selectedRows.length} onClear={clearSelection}>
          {bulkActions?.(selectedRows, clearSelection)}
        </BulkBar>
      )}
    </div>
  );
}

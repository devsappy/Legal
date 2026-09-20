import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";

export type ColumnDef<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Makes the column sortable; strings compare with localeCompare, numbers numerically. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  /** Tabular figures in the mono face: ids, dates, counts. */
  mono?: boolean;
  /** CSS width for the <col>, e.g. "120px" or "20%". */
  width?: string;
  /** Hide in the table below this breakpoint (cards always show every column). */
  hideBelow?: "sm" | "md";
  /** Term shown next to the value in the phone card; defaults to `header`. */
  mobileLabel?: string;
};

export type FilterDef<T> = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  /** Keeps a row when it matches the chosen values (never called with an empty list). */
  test: (row: T, values: string[]) => boolean;
};

export type SortDir = "asc" | "desc";

export type TableState = {
  q: string;
  /** Column id, or null when unsorted. */
  sort: string | null;
  dir: SortDir;
  /** 1-based. */
  page: number;
  size: number;
  /** Active filter values per FilterDef id; absent or empty means "any". */
  filters: Record<string, string[]>;
};

/**
 * Every string the table renders. When the `labels` prop is omitted the
 * table builds this itself from the `ui` namespace (`tableLabels(useTranslations("ui"))`);
 * pass your own object to override any of them for a one-off. Required
 * members map 1:1 onto `ui.*` keys; the optional ones have accessible
 * fallbacks (the header text names its sort button, the first cell names
 * its row's checkbox).
 */
export type DataTableLabels = {
  /** Search placeholder when the `search` prop gives none, and its accessible name (`ui.search`). */
  search: string;
  /** Accessible name of the "x" in the search field and of the bulk bar's close (`ui.clear`). */
  clear: string;
  /** Toolbar link that resets search and filters (`ui.clearFilters`). */
  clearFilters: string;
  /** Empty-state title when search/filters hide every row (`ui.noResults`). */
  noResults: string;
  /** Accessible name of the header checkbox (`ui.selectAll`). */
  selectAll: string;
  /** Bulk bar text, e.g. "3 selected" (`ui.selected` with {count}). */
  selected: (count: number) => string;
  /** Range text, e.g. "1–25 of 132" (`ui.pageOf` with {from} {to} {total}). */
  pageOf: (from: number, to: number, total: number) => string;
  rowsPerPage: string;
  previous: string;
  next: string;
  /** Read out while `loading` is true (`ui.loading`). */
  loading: string;
  /** Live count in the toolbar, e.g. "132 results" (`ui.results` with {count}); hidden when absent. */
  results?: (count: number) => string;
  /** Accessible name of a filter chip's remove button (`ui.removeFilter` with {label}); defaults to "{clear}: {label}". */
  removeFilter?: (label: string) => string;
};

/** The shape of a next-intl `t` for the `ui` namespace, kept structural so any translator fits. */
type Translator = (key: string, values?: Record<string, string | number>) => string;

/**
 * Builds the labels from the `ui` namespace:
 * `const labels = tableLabels(useTranslations("ui"))` — what DataTable does
 * itself when no `labels` prop is given. Keys read: search, clear,
 * clearFilters, noResults, selectAll, selected, pageOf, rowsPerPage,
 * previous, next, loading, results, removeFilter. `extra` overrides any
 * member. Row checkboxes are named by the row's first cell
 * (aria-labelledby), so no per-row label is needed.
 */
export function tableLabels(t: Translator, extra?: Partial<DataTableLabels>, locale = "en"): DataTableLabels {
  // Counts are pre-formatted with Latin digits (mr would otherwise get Devanagari
  // ones from ICU); `results` still receives the number for plural selection.
  const n = (v: number) => formatNumber(v, locale);
  return {
    search: t("search"),
    clear: t("clear"),
    clearFilters: t("clearFilters"),
    noResults: t("noResults"),
    selectAll: t("selectAll"),
    selected: (count) => t("selected", { count: n(count) }),
    pageOf: (from, to, total) => t("pageOf", { from: n(from), to: n(to), total: n(total) }),
    rowsPerPage: t("rowsPerPage"),
    previous: t("previous"),
    next: t("next"),
    loading: t("loading"),
    results: (count) => t("results", { count, n: n(count) }),
    removeFilter: (label) => t("removeFilter", { label }),
    ...extra,
  };
}

export type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Visually hidden <caption>; also names the phone card list. */
  caption: string;
  /** Overrides for the table's strings; omitted = `tableLabels(useTranslations("ui"))`. */
  labels?: Partial<DataTableLabels>;
  /** Controlled state from useTableState(); the table keeps its own when omitted. */
  state?: TableState;
  onStateChange?: (patch: Partial<TableState>) => void;
  search?: { placeholder?: string; test: (row: T, q: string) => boolean };
  filters?: FilterDef<T>[];
  /** Rows are grouped under a header row per key, in first-seen order after sorting. */
  groupBy?: (row: T) => string;
  selectable?: boolean;
  /** Rendered inside the BulkBar once something is selected. */
  bulkActions?: (selected: T[], clear: () => void) => ReactNode;
  onRowClick?: (row: T) => void;
  /** @default [25, 50, 100] */
  pageSizes?: number[];
  loading?: boolean;
  /** Shown when `rows` is empty (before search/filters). */
  empty: { title: string; description?: string; action?: ReactNode; icon?: ReactNode };
  /** Header stays put while the table body scrolls inside a bounded wrapper. */
  stickyHeader?: boolean;
  /** @default "cards" — rows become cards below sm; "scroll" keeps the table and scrolls sideways. */
  mobileLayout?: "cards" | "scroll";
  /** Buttons at the right end of the toolbar (Export, New…). */
  toolbarActions?: ReactNode;
  /** @default "comfortable" */
  density?: "compact" | "comfortable";
  className?: string;
};

"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { usePersisted } from "@/hooks/usePersisted";
import type { SortDir, TableState } from "./types";

export const DEFAULT_PAGE_SIZE = 25;

/** Page size is a device preference, shared by every table. */
const SIZE_KEY = "coop.table.size";

/** Fired after this hook writes the URL so every subscriber re-reads it. */
const URL_EVENT = "coop:url";

/** Query keys: ?q=…&sort=<col>&dir=desc&page=3&f.<filter>=a,b */
const PARAM = { q: "q", sort: "sort", dir: "dir", page: "page", filter: "f." } as const;

export function defaultTableState(size = DEFAULT_PAGE_SIZE): TableState {
  return { q: "", sort: null, dir: "asc", page: 1, size, filters: {} };
}

/* ---- URL as an external store ------------------------------------------- */

function subscribeUrl(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(URL_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(URL_EVENT, cb);
  };
}
const readUrl = () => window.location.search;
const serverUrl = () => "";

/** Reads the table's share of a query string over `base` (unknown keys ignored). */
export function parseTableState(search: string, base: TableState): TableState {
  const p = new URLSearchParams(search);
  const page = Number(p.get(PARAM.page));
  const dir = p.get(PARAM.dir);
  const filters: Record<string, string[]> = {};
  p.forEach((value, key) => {
    if (!key.startsWith(PARAM.filter) || !value) return;
    filters[key.slice(PARAM.filter.length)] = value.split(",").filter(Boolean);
  });
  return {
    ...base,
    q: p.get(PARAM.q) ?? base.q,
    sort: p.get(PARAM.sort) || base.sort,
    dir: dir === "asc" || dir === "desc" ? (dir as SortDir) : base.dir,
    page: Number.isInteger(page) && page > 0 ? page : base.page,
    filters,
  };
}

/** Writes only what differs from `base`, leaving unrelated params alone. */
export function writeTableState(params: URLSearchParams, state: TableState, base: TableState): URLSearchParams {
  const out = new URLSearchParams(params);
  const set = (key: string, value: string | null) => (value ? out.set(key, value) : out.delete(key));
  set(PARAM.q, state.q !== base.q ? state.q : null);
  set(PARAM.sort, state.sort ?? null);
  set(PARAM.dir, state.sort && state.dir !== base.dir ? state.dir : null);
  set(PARAM.page, state.page !== base.page ? String(state.page) : null);
  for (const key of Array.from(out.keys())) if (key.startsWith(PARAM.filter)) out.delete(key);
  for (const [id, values] of Object.entries(state.filters)) if (values.length) out.set(PARAM.filter + id, values.join(","));
  return out;
}

/**
 * Search, sort, page and filters for one DataTable, plus the persisted page
 * size. With `syncUrl` the URL is the store: patches push a history entry
 * (typing in the search box replaces instead, so Back skips the keystrokes)
 * and the Back button restores the previous state. The server snapshot is
 * the default state, so a deep link settles after hydration.
 */
export function useTableState(opts: { syncUrl?: boolean; defaultSize?: number } = {}): [
  TableState,
  (patch: Partial<TableState>) => void,
] {
  const { syncUrl = false, defaultSize = DEFAULT_PAGE_SIZE } = opts;
  const [size, setSize] = usePersisted<number>(SIZE_KEY, defaultSize);
  const [local, setLocal] = useState<TableState>(() => defaultTableState(defaultSize));
  const search = useSyncExternalStore(subscribeUrl, readUrl, serverUrl);

  const state = useMemo<TableState>(() => {
    if (!syncUrl) return { ...local, size };
    return parseTableState(search, defaultTableState(size));
  }, [syncUrl, search, local, size]);

  const patch = useCallback(
    (p: Partial<TableState>) => {
      if (p.size !== undefined) setSize(p.size);
      if (!syncUrl) {
        setLocal((s) => ({ ...s, ...p }));
        return;
      }
      const base = defaultTableState(defaultSize);
      const next = { ...parseTableState(window.location.search, base), ...p };
      const url = new URL(window.location.href);
      url.search = writeTableState(url.searchParams, next, base).toString();
      if (url.href === window.location.href) return;
      const onlyTyping = Object.keys(p).every((k) => k === "q" || k === "page");
      if (onlyTyping && "q" in p) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
      window.dispatchEvent(new Event(URL_EVENT));
    },
    [syncUrl, defaultSize, setSize],
  );

  return [state, patch];
}

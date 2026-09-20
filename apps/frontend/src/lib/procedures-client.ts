"use client";

import { useSyncExternalStore } from "react";
import type { Checklist } from "@sahayak/shared";
import { API_URL } from "./config";

/**
 * The procedure list for client surfaces that need titles without a server
 * round-trip per render: the command palette and the breadcrumb on a
 * checklist page. Fetched once per page load (module cache) and shared
 * through an external store; server pages keep using backendResult().
 */
export type ProceduresState = {
  procedures: Checklist[];
  status: "idle" | "loading" | "ready" | "error";
};

const ENDPOINT = `${API_URL}/api/procedures`;
const EMPTY: Checklist[] = [];
const INITIAL: ProceduresState = { procedures: EMPTY, status: "idle" };

let state: ProceduresState = INITIAL;
let inflight: Promise<Checklist[]> | null = null;
const listeners = new Set<() => void>();

function set(next: ProceduresState) {
  state = next;
  for (const cb of listeners) cb();
}

/** Fetches the list once; later calls share the cached result (or the request in flight). */
export function loadProcedures(force = false): Promise<Checklist[]> {
  if (!force && state.status === "ready") return Promise.resolve(state.procedures);
  if (inflight) return inflight;
  set({ procedures: state.procedures, status: "loading" });
  inflight = fetch(ENDPOINT, { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { procedures?: Checklist[] };
      const list = data.procedures ?? EMPTY;
      set({ procedures: list, status: "ready" });
      return list;
    })
    .catch(() => {
      set({ procedures: state.procedures, status: "error" });
      return state.procedures;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function getProcedures(): ProceduresState {
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * The cached list. Does not fetch by itself: call loadProcedures() from the
 * surface that needs it (on open, on mount) so idle pages cost nothing.
 */
export function useProcedures(): ProceduresState {
  return useSyncExternalStore(subscribe, getProcedures, () => INITIAL);
}

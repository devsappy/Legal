import { useSyncExternalStore } from "react";

/**
 * Toast store. Anything can call `toast.success(...)`; <Toaster/> (mounted
 * once in the root layout) renders the stack and owns the timers, so hover,
 * focus and a hidden tab can pause them. Newest last, three at most.
 */
export type ToastKind = "info" | "success" | "error" | "loading" | "undo";

export type ToastOpts = {
  description?: string;
  action?: { label: string; onClick: () => void };
  /** Milliseconds before the Toaster dismisses it; Infinity keeps it until dismissed. */
  duration?: number;
  /** Runs when the toast leaves the stack for any reason other than its action being clicked. */
  onDismiss?: () => void;
};

export type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  /** Set by toast.undo() when the caller gave no action label; the Toaster renders it with the translated ui.undo. */
  onUndo?: () => void;
  /** Milliseconds; Infinity means the toast stays until dismissed. */
  duration: number;
  createdAt: number;
};

const LIMIT = 3;
const DURATION = 5000;
const DURATION_WITH_ACTION = 8000;

const EMPTY: ToastItem[] = [];
let items: ToastItem[] = EMPTY;
const listeners = new Set<() => void>();
const onDismiss = new Map<string, () => void>();
const actioned = new Set<string>();
let seq = 0;

function emit() {
  for (const cb of listeners) cb();
}

function set(next: ToastItem[]) {
  items = next;
  emit();
}

function newId() {
  seq += 1;
  return `t${Date.now().toString(36)}${seq}`;
}

function durationFor(kind: ToastKind, o?: ToastOpts) {
  if (o?.duration !== undefined) return o.duration;
  if (kind === "loading") return Infinity;
  return o?.action || kind === "undo" ? DURATION_WITH_ACTION : DURATION;
}

/** Wraps a click so it also closes the toast and skips onDismiss. */
function wrapClick(id: string, fn: () => void) {
  return () => {
    actioned.add(id);
    fn();
    remove(id);
  };
}

function wrapAction(id: string, action: { label: string; onClick: () => void } | undefined) {
  return action ? { label: action.label, onClick: wrapClick(id, action.onClick) } : undefined;
}

function push(kind: ToastKind, message: string, o?: ToastOpts, onUndo?: () => void): string {
  const id = newId();
  // An undo with a caller-supplied label is an ordinary action; without one the Toaster labels it.
  const undoLabel = onUndo ? o?.action?.label : undefined;
  const item: ToastItem = {
    id,
    kind,
    message,
    description: o?.description,
    action: onUndo ? (undoLabel ? { label: undoLabel, onClick: wrapClick(id, onUndo) } : undefined) : wrapAction(id, o?.action),
    onUndo: onUndo && !undoLabel ? wrapClick(id, onUndo) : undefined,
    duration: durationFor(kind, o),
    createdAt: Date.now(),
  };
  if (o?.onDismiss) onDismiss.set(id, o.onDismiss);
  // Oldest toasts make room; their onDismiss still runs so deferred work is not lost.
  const overflow = items.length + 1 - LIMIT;
  const kept = overflow > 0 ? items.slice(overflow) : items;
  for (const dropped of items.slice(0, Math.max(0, overflow))) settle(dropped.id);
  set([...kept, item]);
  return id;
}

/** Fires the dismiss callback once, unless the action was taken. */
function settle(id: string) {
  const cb = onDismiss.get(id);
  onDismiss.delete(id);
  if (cb && !actioned.has(id)) cb();
  actioned.delete(id);
}

function remove(id: string) {
  if (!items.some((t) => t.id === id)) return;
  set(items.filter((t) => t.id !== id));
  settle(id);
}

function update(id: string, patch: Partial<Omit<ToastItem, "id">>) {
  if (!items.some((t) => t.id === id)) return;
  set(items.map((t) => (t.id === id ? { ...t, ...patch, action: patch.action ? wrapAction(id, patch.action) : t.action } : t)));
}

export const toast = {
  info(message: string, o?: ToastOpts): string {
    return push("info", message, o);
  },
  success(message: string, o?: ToastOpts): string {
    return push("success", message, o);
  },
  error(message: string, o?: ToastOpts): string {
    return push("error", message, o);
  },
  /**
   * An ink chip with an Undo button. `onUndo` runs on click; `o.onDismiss`
   * runs when the toast closes without it (the moment to commit a delete).
   */
  undo(message: string, onUndo: () => void, o?: ToastOpts): string {
    return push("undo", message, o, onUndo);
  },
  /** Shows a loading toast, then swaps it for the outcome in place. */
  promise<T>(
    p: Promise<T>,
    m: { loading: string; success: string | ((v: T) => string); error: string },
    o?: ToastOpts,
  ): Promise<T> {
    const id = push("loading", m.loading, { ...o, duration: Infinity });
    p.then(
      (v) => update(id, { kind: "success", message: typeof m.success === "function" ? m.success(v) : m.success, duration: durationFor("success", o), createdAt: Date.now() }),
      () => update(id, { kind: "error", message: m.error, duration: durationFor("error", o), createdAt: Date.now() }),
    );
    return p;
  },
  /** Removes one toast, or every toast when no id is given. */
  dismiss(id?: string): void {
    if (id) return remove(id);
    const gone = items;
    set(EMPTY);
    for (const t of gone) settle(t.id);
  },
};

/** Current stack, oldest first; a stable reference until something changes. */
export function getSnapshot(): ToastItem[] {
  return items;
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** The live stack for React. Server snapshot is empty. */
export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

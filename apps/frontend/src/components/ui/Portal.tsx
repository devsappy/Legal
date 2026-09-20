"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders its children outside the app card whose <main> is the only scroll
 * container. Floating layers (tooltips, menus, toasts, the bulk bar) go
 * through here so `position: fixed` measures against the viewport rather
 * than a transformed or clipped ancestor.
 *
 * The container is <body>, unless a modal <dialog> is open: showModal()
 * makes everything outside the dialog inert, so a menu, tooltip or toast
 * raised while a drawer or dialog is up mounts inside the top-most open
 * dialog instead and stays interactive. A resting dialog has
 * `transform: none` and `overflow: visible`, so fixed positioning still
 * measures against the viewport.
 *
 * Nothing is rendered on the server or during hydration: the store below
 * reports "not mounted" for the server snapshot, so the markup never has to
 * match a document body the server did not see.
 */

const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;
/** Open modal dialogs, oldest first; the last one is on top of the top layer. */
let stack: HTMLDialogElement[] = [];
let container: Element | null = null;

function openModals(): HTMLDialogElement[] {
  try {
    return Array.from(document.querySelectorAll<HTMLDialogElement>("dialog:modal"));
  } catch {
    return Array.from(document.querySelectorAll<HTMLDialogElement>("dialog[open]"));
  }
}

/** The element floating layers mount into right now. */
function compute(): Element {
  const open = openModals();
  stack = stack.filter((d) => d.isConnected && d.open && open.includes(d));
  for (const d of open) if (!stack.includes(d)) stack.push(d);
  return stack[stack.length - 1] ?? document.body;
}

function onMutation() {
  const next = compute();
  if (next !== container) {
    container = next;
    for (const l of listeners) l();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!observer) {
    observer = new MutationObserver(onMutation);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });
    // A dialog may have opened while nothing was watching.
    onMutation();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      observer?.disconnect();
      observer = null;
      container = null;
    }
  };
}

function getSnapshot(): Element {
  if (!container) container = compute();
  return container;
}

const getServerSnapshot = () => null;

export function Portal({ children }: { children: ReactNode }) {
  const target = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!target) return null;
  return createPortal(children, target);
}

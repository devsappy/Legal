"use client";

import { useEffect, useRef } from "react";
import { isEditableTarget, matchesStep, parseCombo, type Combo, type ComboStep } from "@/lib/keys";
import { registerShortcut, type ShortcutScope } from "@/lib/shortcuts";

/**
 * Binds a combo to a handler for as long as the component is mounted, and
 * lists it in the shortcuts registry so the help sheet can show it.
 *
 * One window listener serves every binding. The most recently mounted
 * binding for a combo wins, so a drawer can shadow a global key while open.
 * Chords ("g h") wait up to a second for their second key.
 */
type Binding = {
  id: string;
  steps: ComboStep[];
  enabled: boolean;
  allowInInputs: boolean;
  handler: { current: (e: KeyboardEvent) => void };
};

const CHORD_WINDOW = 1000;
const bindings: Binding[] = [];
let listening = false;
let pending: { step: ComboStep; at: number } | null = null;

function onKeyDown(e: KeyboardEvent) {
  if (e.defaultPrevented || e.isComposing) return;
  const editable = isEditableTarget(e.target);
  const now = Date.now();
  const prefix = pending && now - pending.at <= CHORD_WINDOW ? pending.step : null;

  // Newest first: the innermost surface owns the key.
  for (let i = bindings.length - 1; i >= 0; i--) {
    const b = bindings[i];
    if (!b.enabled || (editable && !b.allowInInputs)) continue;

    if (b.steps.length === 1) {
      if (!matchesStep(e, b.steps[0])) continue;
      pending = null;
      e.preventDefault();
      b.handler.current(e);
      return;
    }

    // Two-step chord: complete it, or start it.
    const [first, second] = b.steps;
    if (prefix && sameStep(prefix, first) && matchesStep(e, second)) {
      pending = null;
      e.preventDefault();
      b.handler.current(e);
      return;
    }
    if (!prefix && matchesStep(e, first)) {
      pending = { step: first, at: now };
      e.preventDefault();
      return;
    }
  }
  // Anything unmatched cancels a half-typed chord.
  if (prefix) pending = null;
}

function sameStep(a: ComboStep, b: ComboStep) {
  return a.key === b.key && a.mod === b.mod && a.shift === b.shift && a.alt === b.alt;
}

function attach() {
  if (listening) return;
  window.addEventListener("keydown", onKeyDown);
  listening = true;
}

function detach() {
  if (!listening || bindings.length) return;
  window.removeEventListener("keydown", onKeyDown);
  listening = false;
}

export type HotkeyOptions = {
  id: string;
  scope: ShortcutScope;
  /** Already translated; shown in the shortcuts sheet. */
  label: string;
  enabled?: boolean;
  /** Fire even when an input, textarea or editable region has focus. */
  allowInInputs?: boolean;
};

export function useHotkey(combo: Combo, handler: (e: KeyboardEvent) => void, opts: HotkeyOptions): void {
  const { id, scope, label, enabled = true, allowInInputs = false } = opts;

  // The binding reads the latest handler through a ref so callers can pass
  // a fresh closure every render without re-binding.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const steps = parseCombo(combo);
    if (steps.length === 0 || steps.length > 2) return;
    const binding: Binding = { id, steps, enabled, allowInInputs, handler: handlerRef };
    bindings.push(binding);
    attach();
    const unregister = registerShortcut({ id, combo, scope, label });
    return () => {
      const at = bindings.indexOf(binding);
      if (at >= 0) bindings.splice(at, 1);
      unregister();
      detach();
    };
  }, [combo, id, scope, label, enabled, allowInInputs]);
}

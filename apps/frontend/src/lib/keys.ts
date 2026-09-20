/**
 * Keyboard combos, written once and matched everywhere.
 *
 * Grammar: keys joined with "+", chords separated by a space.
 *   "mod+k"        Cmd on macOS, Ctrl elsewhere
 *   "mod+shift+o"
 *   "shift+/"      the "?" key on a US layout
 *   "escape"       named keys: escape, enter, space, tab, backspace, delete,
 *                  arrowup/down/left/right, home, end, pageup, pagedown
 *   "g h"          chord: "g" then "h" within one second (see useHotkey)
 */
export type Combo = string;

export type ComboStep = {
  mod: boolean;
  shift: boolean;
  alt: boolean;
  /** Lower-case key name, e.g. "k", "/", "escape", "arrowdown". */
  key: string;
};

/** Keys the OS labels with a glyph; everything else is spelled out. */
const GLYPHS: Record<string, string> = {
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  enter: "↵",
  escape: "Esc",
  backspace: "⌫",
  delete: "Del",
  space: "Space",
  tab: "Tab",
  home: "Home",
  end: "End",
  pageup: "PgUp",
  pagedown: "PgDn",
};

/** Keys that need Shift on a US layout, so Shift is implied when they are pressed. */
const SHIFTED: Record<string, string> = { "?": "/", "<": ",", ">": ".", ":": ";", _: "-", "+": "=", "|": "\\", "~": "`" };

/** True on Apple platforms; false on the server so markup is deterministic. */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = ua.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/** One chord step: "mod+shift+o" -> { mod, shift, alt, key }. */
export function parseStep(step: string): ComboStep {
  const parts = step.toLowerCase().split("+").filter(Boolean);
  const out: ComboStep = { mod: false, shift: false, alt: false, key: "" };
  for (const part of parts) {
    if (part === "mod" || part === "ctrl" || part === "control" || part === "cmd" || part === "meta") out.mod = true;
    else if (part === "shift") out.shift = true;
    else if (part === "alt" || part === "option") out.alt = true;
    else out.key = part;
  }
  // "+" on its own ("mod++") is swallowed by split; treat an empty key with a trailing plus as "+"
  if (!out.key && step.trim().endsWith("+")) out.key = "+";
  return out;
}

/** Every step of a combo; a plain combo is a one-step chord. */
export function parseCombo(combo: Combo): ComboStep[] {
  return combo.trim().split(/\s+/).filter(Boolean).map(parseStep);
}

/**
 * Display labels, one per chip: "mod+k" -> ["⌘", "K"] on a Mac, ["Ctrl", "K"]
 * elsewhere. Chords flatten in order ("g h" -> ["G", "H"]).
 */
export function formatShortcut(combo: Combo): string[] {
  const mac = isMac();
  const labels: string[] = [];
  for (const step of parseCombo(combo)) {
    if (step.mod) labels.push(mac ? "⌘" : "Ctrl");
    if (step.alt) labels.push(mac ? "⌥" : "Alt");
    if (step.shift) labels.push(mac ? "⇧" : "Shift");
    if (!step.key) continue;
    labels.push(GLYPHS[step.key] ?? (step.key.length === 1 ? step.key.toUpperCase() : step.key));
  }
  return labels;
}

/** Whether the key the event carries is the one a step names. */
function keyMatches(e: KeyboardEvent, step: ComboStep): boolean {
  const key = e.key.toLowerCase();
  const want = step.key === "space" ? " " : step.key;
  if (key === want) return true;
  // Shifted symbols: "shift+/" is pressed as "?" on a US layout.
  if (step.shift && SHIFTED[e.key] === want) return true;
  // Non-Latin layouts (Devanagari, Tamil) report the layout's character in
  // e.key; fall back to the physical key so mod+k still works.
  if (want.length === 1) {
    if (/[a-z]/.test(want) && e.code === `Key${want.toUpperCase()}`) return true;
    if (/[0-9]/.test(want) && e.code === `Digit${want}`) return true;
  }
  return false;
}

/** Does a keydown event match a single-step combo? Chords are handled by useHotkey. */
export function matchesStep(e: KeyboardEvent, step: ComboStep): boolean {
  if (!keyMatches(e, step)) return false;
  const mac = isMac();
  const modDown = mac ? e.metaKey : e.ctrlKey;
  const otherMod = mac ? e.ctrlKey : e.metaKey;
  if (step.mod !== modDown || otherMod) return false;
  if (step.alt !== e.altKey) return false;
  // Shift is implied for shifted symbols ("?"), otherwise it must match exactly.
  const shifted = e.key in SHIFTED || (step.key.length === 1 && !/[a-z0-9]/.test(step.key) && e.shiftKey);
  if (!shifted && step.shift !== e.shiftKey) return false;
  return true;
}

export function matchesCombo(e: KeyboardEvent, combo: Combo): boolean {
  const steps = parseCombo(combo);
  return steps.length === 1 && matchesStep(e, steps[0]);
}

/** Inputs, textareas, selects and editable regions: single-key shortcuts must not fire there. */
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type;
    return !["checkbox", "radio", "button", "submit", "range", "file"].includes(type);
  }
  return Boolean(el.closest('[contenteditable=""], [contenteditable="true"]'));
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import clsx from "clsx";
import { Check, Circle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAnchor, type AnchorAlign } from "@/hooks/useAnchor";
import type { Combo } from "@/lib/keys";
import { Kbd } from "./Kbd";
import { Portal } from "./Portal";
import { useMergedRef } from "./Tooltip";

/** Typeahead buffer resets after this much silence. */
const TYPEAHEAD_MS = 600;

const ITEMS = '[role^="menuitem"]:not([aria-disabled="true"])';

type MenuContext = {
  /** Close the menu; `restoreFocus` is true for keyboard paths. */
  close: (restoreFocus: boolean) => void;
};
const Ctx = createContext<MenuContext | null>(null);

type TriggerProps = {
  ref?: Ref<HTMLElement>;
  id?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-haspopup"?: "menu";
};

type MenuProps = {
  /** One focusable element; it receives the toggle handler and aria wiring. */
  trigger: ReactElement;
  /** Accessible name of the menu when the trigger is an icon without text. */
  label?: string;
  align?: AnchorAlign;
  side?: "top" | "bottom";
  className?: string;
  children: ReactNode;
};

function items(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEMS)) : [];
}

/**
 * Action menu on a trigger: role=menu with roving focus (ArrowUp/Down,
 * Home/End, wrap-around), typeahead on the item text, Escape/Tab/outside
 * press to close, focus returned to the trigger. Opening with ArrowUp lands
 * on the last item. Items are the Menu* components below; anything else is
 * skipped by the keyboard.
 */
export function DropdownMenu({ trigger, label, align = "start", side = "bottom", className, children }: MenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const t = trigger as ReactElement<TriggerProps>;
  const tp = t.props;
  const Trigger = t.type as ElementType<TriggerProps>;
  const [anchor, attach] = useMergedRef<HTMLElement>(tp.ref);
  const menu = useRef<HTMLDivElement>(null);
  const startAt = useRef<"first" | "last">("first");
  const restore = useRef(true);
  const typed = useRef({ text: "", at: 0 });

  useAnchor(menu, anchor, { side, align, gutter: 6, open });

  const openWith = (from: "first" | "last") => {
    startAt.current = from;
    setOpen(true);
  };
  const close = (restoreFocus: boolean) => {
    restore.current = restoreFocus;
    setOpen(false);
  };

  // Focus the first/last item on open; give focus back on close unless the
  // user already clicked somewhere else.
  useEffect(() => {
    if (!open) return;
    const trig = anchor.current;
    const list = items(menu.current);
    (startAt.current === "last" ? list[list.length - 1] : list[0])?.focus({ preventScroll: true });
    return () => {
      if (restore.current && trig?.isConnected) trig.focus({ preventScroll: true });
      restore.current = true;
    };
  }, [open, anchor]);

  const dismiss = useEffectEvent((restoreFocus: boolean) => close(restoreFocus));
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menu.current?.contains(t) || anchor.current?.contains(t)) return;
      dismiss(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open, anchor]);

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items(menu.current);
    if (!list.length) return;
    const current = list.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => list[(i + list.length) % list.length]?.focus({ preventScroll: true });

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        go(current + 1);
        return;
      case "ArrowUp":
        e.preventDefault();
        go(current - 1);
        return;
      case "Home":
      case "PageUp":
        e.preventDefault();
        go(0);
        return;
      case "End":
      case "PageDown":
        e.preventDefault();
        go(list.length - 1);
        return;
      case "Escape":
        e.preventDefault();
        close(true);
        return;
      case "Tab":
        // Let focus move on naturally; the menu just gets out of the way.
        close(false);
        return;
    }

    // Typeahead: printable keys build a prefix; matching starts after the
    // focused item so repeated letters cycle through candidates.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== " ") {
      e.preventDefault();
      const now = Date.now();
      const text = (now - typed.current.at < TYPEAHEAD_MS ? typed.current.text : "") + e.key.toLowerCase();
      typed.current = { text, at: now };
      const from = current + 1;
      for (let step = 0; step < list.length; step++) {
        const el = list[(from + step) % list.length];
        if ((el.textContent ?? "").trim().toLowerCase().startsWith(text)) {
          el.focus({ preventScroll: true });
          return;
        }
      }
    }
  };

  const triggerId = tp.id ?? `${id}-trigger`;

  return (
    <Ctx.Provider value={{ close }}>
      <Trigger
        {...tp}
        ref={attach}
        id={triggerId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={(e) => {
          tp.onClick?.(e);
          if (e.defaultPrevented) return;
          if (open) close(true);
          else openWith("first");
        }}
        onKeyDown={(e) => {
          tp.onKeyDown?.(e);
          if (e.defaultPrevented || open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            openWith("first");
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            openWith("last");
          }
        }}
      />
      {open && (
        <Portal>
          <div
            ref={menu}
            id={id}
            role="menu"
            aria-label={label}
            aria-labelledby={label ? undefined : triggerId}
            data-motion
            onKeyDown={onMenuKeyDown}
            className={clsx(
              "rise fixed z-(--z-popover) min-w-[180px] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-rule bg-sheet p-1 text-sm text-ink shadow-popover outline-none max-h-[min(70vh,420px)]",
              className,
            )}
          >
            {children}
          </div>
        </Portal>
      )}
    </Ctx.Provider>
  );
}

function useMenu(): MenuContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Menu items must be rendered inside <DropdownMenu>.");
  return ctx;
}

const ITEM_CLASS =
  "flex w-full cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors focus:bg-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-45";

type ItemProps = {
  icon?: ReactNode;
  /** Shown as a Kbd hint on the right; the binding itself lives with useHotkey. */
  shortcut?: Combo;
  destructive?: boolean;
  disabled?: boolean;
  /** Renders a navigation link instead of a button. */
  href?: string;
  onSelect?: () => void;
  children: ReactNode;
};

/** Focus follows the pointer so mouse and keyboard agree on the active item. */
function focusOnHover(e: MouseEvent<HTMLElement>) {
  if (e.currentTarget.getAttribute("aria-disabled") !== "true") e.currentTarget.focus({ preventScroll: true });
}

export function MenuItem({ icon, shortcut, destructive, disabled, href, onSelect, children }: ItemProps) {
  const { close } = useMenu();
  const cls = clsx(ITEM_CLASS, destructive ? "text-seal focus:bg-seal-soft" : "text-ink");
  const body = (
    <>
      {icon && (
        <span aria-hidden className={clsx("flex w-4 shrink-0 justify-center", destructive ? "text-seal" : "text-ink-2")}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <Kbd combo={shortcut} className="ml-4 shrink-0" />}
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        role="menuitem"
        tabIndex={-1}
        className={cls}
        onMouseMove={focusOnHover}
        onClick={() => {
          onSelect?.();
          close(false);
        }}
        onKeyDown={(e) => {
          if (e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
      >
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={cls}
      onMouseMove={focusOnHover}
      onClick={() => {
        if (disabled) return;
        onSelect?.();
        close(true);
      }}
    >
      {body}
    </button>
  );
}

/**
 * Toggle that stays open after a click, so several can be flipped in one
 * visit (the DataTable filter menus rely on this).
 */
export function MenuCheckboxItem({
  checked,
  onCheckedChange,
  disabled,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      tabIndex={-1}
      className={clsx(ITEM_CLASS, "text-ink")}
      onMouseMove={focusOnHover}
      onClick={() => {
        if (!disabled) onCheckedChange(!checked);
      }}
    >
      <span
        aria-hidden
        className={clsx(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          checked ? "border-ink bg-ink text-paper" : "border-rule-strong bg-sheet",
        )}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

const RadioCtx = createContext<{ value: string; onValueChange: (v: string) => void } | null>(null);

export function MenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <RadioCtx.Provider value={{ value, onValueChange }}>
      <div role="group">{children}</div>
    </RadioCtx.Provider>
  );
}

export function MenuRadioItem({ value, icon, children }: { value: string; icon?: ReactNode; children: ReactNode }) {
  const group = useContext(RadioCtx);
  const { close } = useMenu();
  if (!group) throw new Error("<MenuRadioItem> must be inside <MenuRadioGroup>.");
  const checked = group.value === value;
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      tabIndex={-1}
      className={clsx(ITEM_CLASS, "text-ink")}
      onMouseMove={focusOnHover}
      onClick={() => {
        group.onValueChange(value);
        close(true);
      }}
    >
      <span aria-hidden className="flex w-4 shrink-0 justify-center text-ink">
        {checked ? <Circle size={8} fill="currentColor" /> : icon ? <span className="text-ink-2">{icon}</span> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" aria-orientation="horizontal" className="my-1 h-px bg-rule" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div role="presentation" className="px-2 pb-1 pt-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
      {children}
    </div>
  );
}

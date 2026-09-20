"use client";

import {
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
import { useAnchor, type AnchorAlign } from "@/hooks/useAnchor";
import { Portal } from "./Portal";
import { useMergedRef } from "./Tooltip";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

type TriggerProps = {
  ref?: Ref<HTMLElement>;
  id?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-haspopup"?: "dialog" | "menu" | "listbox" | "true";
};

type Props = {
  /** One focusable element; it receives the toggle handler and aria wiring. */
  trigger: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "bottom";
  align?: AnchorAlign;
  /** Accessible name of the panel, if its content does not start with a heading. */
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Non-modal floating panel anchored to its trigger: filters, date pickers,
 * "what's this" cards. Portalled and positioned by useAnchor, closes on
 * outside press, Escape or focus leaving both panel and trigger, and hands
 * focus back to the trigger. Works controlled (`open`/`onOpenChange`) or on
 * its own.
 */
export function Popover({ trigger, open, onOpenChange, side = "bottom", align = "start", ariaLabel, className, children }: Props) {
  const id = useId();
  const [ownOpen, setOwnOpen] = useState(false);
  const isOpen = open ?? ownOpen;
  const t = trigger as ReactElement<TriggerProps>;
  const tp = t.props;
  const Trigger = t.type as ElementType<TriggerProps>;
  const [anchor, attach] = useMergedRef<HTMLElement>(tp.ref);
  const panel = useRef<HTMLDivElement>(null);
  const returnFocus = useRef(false);

  const setOpen = (next: boolean) => {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  useAnchor(panel, anchor, { side, align, open: isOpen });

  // Move focus into the panel on open; give it back on close when the
  // panel had it, so a click elsewhere does not yank focus around.
  useEffect(() => {
    const node = panel.current;
    const trig = anchor.current;
    if (!isOpen || !node) return;
    (node.querySelector<HTMLElement>(FOCUSABLE) ?? node).focus({ preventScroll: true });
    returnFocus.current = true;
    return () => {
      if (returnFocus.current && trig?.isConnected) trig.focus({ preventScroll: true });
      returnFocus.current = false;
    };
  }, [isOpen, anchor]);

  // Escape keeps focus return on (keyboard users expect it); an outside
  // press already moved focus somewhere deliberate, so it does not.
  const dismiss = useEffectEvent((restoreFocus: boolean) => {
    returnFocus.current = restoreFocus;
    setOpen(false);
  });
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      dismiss(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      dismiss(true);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, anchor]);

  return (
    <>
      <Trigger
        {...tp}
        ref={attach}
        aria-expanded={isOpen}
        aria-controls={isOpen ? id : undefined}
        aria-haspopup={tp["aria-haspopup"] ?? "dialog"}
        onClick={(e) => {
          tp.onClick?.(e);
          if (!e.defaultPrevented) setOpen(!isOpen);
        }}
      />
      {isOpen && (
        <Portal>
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-label={ariaLabel}
            tabIndex={-1}
            data-motion
            onBlur={(e) => {
              // Tabbing out of the panel (not to the trigger) closes it.
              const next = e.relatedTarget as Node | null;
              if (next && !panel.current?.contains(next) && !anchor.current?.contains(next)) {
                returnFocus.current = false;
                setOpen(false);
              }
            }}
            className={clsx(
              "rise fixed z-(--z-popover) max-w-[calc(100vw-1rem)] rounded-lg border border-rule bg-sheet p-3 text-sm text-ink shadow-popover outline-none",
              className,
            )}
          >
            {children}
          </div>
        </Portal>
      )}
    </>
  );
}

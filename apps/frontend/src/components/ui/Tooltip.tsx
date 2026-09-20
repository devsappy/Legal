"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ElementType,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type Ref,
  type RefCallback,
  type RefObject,
} from "react";
import clsx from "clsx";
import { useAnchor, type AnchorSide } from "@/hooks/useAnchor";
import { Portal } from "./Portal";

/** Hover waits so a cursor crossing a toolbar does not flash every label. */
const HOVER_DELAY = 400;

type ChildProps = {
  ref?: Ref<HTMLElement>;
  "aria-describedby"?: string;
  onPointerEnter?: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (e: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
};

type Props = {
  content: string;
  side?: AnchorSide;
  /** One element that accepts a ref and pointer/focus handlers (a button, a link). */
  children: ReactElement;
  className?: string;
};

/** Assigns a node to a callback or object ref, the way React itself does. */
function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

/**
 * An object ref for measuring a cloned child plus the callback to hand it,
 * which also feeds the child's own ref so neither side loses the node.
 * Shared by Tooltip, Popover and DropdownMenu.
 */
export function useMergedRef<T>(external: Ref<T> | undefined): [RefObject<T | null>, RefCallback<T>] {
  const own = useRef<T>(null);
  const attach = useCallback(
    (node: T | null) => {
      own.current = node;
      assignRef(external, node);
    },
    [external],
  );
  return [own, attach];
}

/**
 * A label bubble for icon-only controls. Shows instantly on keyboard focus,
 * after a short delay on hover, never on touch (the label is already the
 * control's aria-label). Escape hides it. The bubble portals to <body> and
 * is positioned by useAnchor; the child gets aria-describedby while open.
 */
export function Tooltip({ content, side = "top", children, className }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const child = children as ReactElement<ChildProps>;
  const p = child.props;
  // Re-rendered as JSX rather than cloneElement so the handlers below are
  // recognised as props (never called during render) by the compiler rules.
  const Trigger = child.type as ElementType<ChildProps>;
  const [anchor, attach] = useMergedRef<HTMLElement>(p.ref);
  const bubble = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  useAnchor(bubble, anchor, { side, align: "center", gutter: 6, open });

  // Escape hides it from anywhere on the page.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // A pending hover open must not fire after unmount.
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const show = (delay: number) => {
    clear();
    if (delay) timer.current = window.setTimeout(() => setOpen(true), delay);
    else setOpen(true);
  };
  const hide = () => {
    clear();
    setOpen(false);
  };

  return (
    <>
      <Trigger
        {...p}
        ref={attach}
        aria-describedby={open ? id : p["aria-describedby"]}
        onPointerEnter={(e) => {
          p.onPointerEnter?.(e);
          if (e.pointerType !== "touch") show(HOVER_DELAY);
        }}
        onPointerLeave={(e) => {
          p.onPointerLeave?.(e);
          hide();
        }}
        onPointerDown={(e) => {
          p.onPointerDown?.(e);
          hide();
        }}
        onFocus={(e) => {
          p.onFocus?.(e);
          // Mouse clicks focus too; only keyboard focus (focus-visible) shows the label.
          if (e.currentTarget.matches(":focus-visible")) show(0);
        }}
        onBlur={(e) => {
          p.onBlur?.(e);
          hide();
        }}
      />
      {open && (
        <Portal>
          <div
            ref={bubble}
            id={id}
            role="tooltip"
            data-motion
            className={clsx(
              "rise pointer-events-none fixed z-(--z-popover) max-w-[260px] rounded-md bg-ink px-2 py-1 text-2xs font-medium leading-snug text-paper shadow-popover",
              className,
            )}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}

"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

/** Interactive descendants a dialog may hand initial focus to. */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/* Nested dialogs stack; the page behind scrolls again once the last one closes.
   The scrollbar's width is kept as padding so the layout does not jump. */
let locks = 0;
function lockScroll() {
  if (locks++ > 0) return;
  const root = document.documentElement;
  const gap = window.innerWidth - root.clientWidth;
  root.style.overflow = "hidden";
  if (gap > 0) root.style.paddingRight = `${gap}px`;
}
function unlockScroll() {
  if (--locks > 0) return;
  const root = document.documentElement;
  root.style.overflow = "";
  root.style.paddingRight = "";
}

/**
 * Classes shared by every modal surface. The element is a native <dialog>
 * opened with showModal(), which gives the top layer, the focus trap, Escape
 * and `inert` for the rest of the page for free. Motion is not set here:
 * globals.css transitions `dialog[data-motion]` (and its ::backdrop) on
 * opacity/transform with @starting-style, allow-discrete and a reduced-motion
 * branch, and slides drawers by `data-side`. These utilities only shape the
 * box; they sit in the utilities layer so they win over that base rule.
 */
export const DIALOG_SURFACE =
  "fixed inset-0 m-auto flex-col border border-rule bg-sheet p-0 text-ink shadow-overlay outline-none open:flex";

export type DialogBaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: "dialog" | "alertdialog";
  labelledBy?: string;
  describedBy?: string;
  /**
   * Element focused on open. Falls back to the first `[data-autofocus]`
   * descendant, then the first focusable control, then the panel itself.
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Clicking the backdrop closes the dialog. Alert dialogs turn this off. */
  dismissible?: boolean;
  /** Slide direction for drawers; globals.css keys the transform on it. */
  side?: "right" | "left" | "bottom";
  className?: string;
  style?: CSSProperties;
  dialogRef?: RefObject<HTMLDialogElement | null>;
  children: ReactNode;
};

/**
 * Controlled wrapper over <dialog>. `open` drives showModal()/close();
 * Escape and native closes report back through onOpenChange so the parent
 * stays the source of truth. Focus returns to whatever was focused before
 * the dialog opened, including when it unmounts while open.
 */
export function DialogBase({
  open,
  onOpenChange,
  role = "dialog",
  labelledBy,
  describedBy,
  initialFocusRef,
  dismissible = true,
  side,
  className,
  style,
  dialogRef,
  children,
}: DialogBaseProps) {
  const own = useRef<HTMLDialogElement>(null);
  const ref = dialogRef ?? own;
  const opener = useRef<HTMLElement | null>(null);
  const downOnBackdrop = useRef(false);

  // Read through an effect event so a consumer passing a fresh ref object
  // each render cannot make the open/close effect re-run.
  const focusInitial = useEffectEvent((el: HTMLDialogElement) => {
    const target =
      initialFocusRef?.current ??
      el.querySelector<HTMLElement>("[data-autofocus]") ??
      el.querySelector<HTMLElement>(FOCUSABLE) ??
      el;
    target.focus({ preventScroll: true });
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!el.open) el.showModal();
    lockScroll();
    focusInitial(el);
    return () => {
      // Runs on close and on unmount while open: hide, unlock, hand focus back.
      if (el.open) el.close();
      unlockScroll();
      const back = opener.current;
      if (back?.isConnected) back.focus({ preventScroll: true });
      opener.current = null;
    };
  }, [open, ref]);

  // Only a press that both started and ended on the backdrop closes, so a
  // text selection dragged out of the panel does not dismiss it.
  const onPointerDown = (e: PointerEvent<HTMLDialogElement>) => {
    downOnBackdrop.current = e.target === e.currentTarget;
  };
  const onClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (dismissible && downOnBackdrop.current && e.target === e.currentTarget) onOpenChange(false);
    downOnBackdrop.current = false;
  };

  return (
    <dialog
      ref={ref}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      data-motion
      data-side={side}
      className={clsx(DIALOG_SURFACE, className)}
      style={style}
      onPointerDown={onPointerDown}
      onClick={onClick}
      // Escape: keep the element open and let the parent flip `open`, so the
      // exit transition runs from state. Chrome may refuse the preventDefault
      // on a repeated Escape; onClose covers that path.
      onCancel={(e) => {
        e.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => {
        if (open) onOpenChange(false);
      }}
    >
      {children}
    </dialog>
  );
}

const SIZES = { sm: "sm:max-w-[420px]", md: "sm:max-w-[560px]", lg: "sm:max-w-[720px]" } as const;

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: keyof typeof SIZES;
  footer?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Keep the title for assistive tech only (e.g. a command palette). */
  hideTitle?: boolean;
  /** Accessible name of the close button; defaults to the translated `ui.close`. */
  closeLabel?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Centred modal on desktop, bottom sheet on phones. Title and description
 * are wired to aria-labelledby/-describedby; the body scrolls on its own
 * while the header and footer stay put.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  footer,
  initialFocusRef,
  hideTitle,
  closeLabel,
  className,
  children,
}: DialogProps) {
  const t = useTranslations("ui");
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  return (
    <DialogBase
      open={open}
      onOpenChange={onOpenChange}
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
      initialFocusRef={initialFocusRef}
      className={clsx(
        "w-full max-h-[calc(100dvh-2rem)] rounded-lg sm:w-[calc(100vw-2rem)]",
        SIZES[size],
        // Phones: a sheet pinned to the bottom edge that grows with its content.
        "max-sm:mb-0 max-sm:max-h-[calc(100dvh-1rem)] max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-xl max-sm:border-x-0 max-sm:border-b-0",
        className,
      )}
    >
      <header className={clsx("flex items-start gap-3", hideTitle ? "relative" : "px-5 pt-5 pb-3")}>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className={clsx("text-lg", hideTitle && "sr-only")}>
            {title}
          </h2>
          {description && (
            <p id={descId} className={clsx("mt-1 text-sm text-ink-2", hideTitle && "sr-only")}>
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label={closeLabel ?? t("close")}
          onClick={() => onOpenChange(false)}
          className={clsx(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-muted hover:text-ink",
            hideTitle ? "absolute right-2 top-2 z-10" : "-mr-2 -mt-2",
          )}
        >
          <X size={16} aria-hidden />
        </button>
      </header>
      <div className={clsx("min-h-0 flex-1 overflow-y-auto overscroll-contain text-sm", hideTitle ? "p-0" : "px-5 pb-5")}>
        {children}
      </div>
      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-rule px-5 py-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {footer}
        </footer>
      )}
    </DialogBase>
  );
}

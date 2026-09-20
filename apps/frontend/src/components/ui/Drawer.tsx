"use client";

import { useId, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DialogBase } from "./Dialog";

type Side = "right" | "left" | "bottom";

/** Pulling the sheet further than this closes it. */
const SWIPE_CLOSE = 80;

/* Side panels on sm+; the phone rules below win under 640px regardless.
   The slide itself comes from globals.css via data-side. */
const SIDE: Record<Side, string> = {
  right: "sm:my-0 sm:ml-auto sm:mr-0 sm:h-dvh sm:max-h-none sm:w-(--drawer-w) sm:max-w-full sm:rounded-none sm:border-y-0 sm:border-r-0",
  left: "sm:my-0 sm:mr-auto sm:ml-0 sm:h-dvh sm:max-h-none sm:w-(--drawer-w) sm:max-w-full sm:rounded-none sm:border-y-0 sm:border-l-0",
  bottom:
    "sm:mx-auto sm:mt-auto sm:mb-0 sm:w-full sm:max-w-[720px] sm:max-h-[85dvh] sm:rounded-t-xl sm:rounded-b-none sm:border-b-0",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: Side;
  title: string;
  description?: string;
  /** Panel width on sm+ for left/right drawers. */
  width?: string;
  footer?: ReactNode;
  hideTitle?: boolean;
  /** Accessible name of the close button; defaults to the translated `ui.close`. */
  closeLabel?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Edge panel on the same native <dialog> base as Dialog. Slides in from the
 * chosen side on desktop; on phones it is always a bottom sheet with a grab
 * handle that can be dragged down to dismiss.
 */
export function Drawer({
  open,
  onOpenChange,
  side = "right",
  title,
  description,
  width = "min(100vw,440px)",
  footer,
  hideTitle,
  closeLabel,
  className,
  children,
}: Props) {
  const t = useTranslations("ui");
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ startY: number; dy: number } | null>(null);
  // Below sm the panel is a bottom sheet, so it should also slide up from the bottom.
  const phone = useMediaQuery("(max-width: 639px)");

  // Swipe-to-close on the handle: the sheet follows the finger and either
  // snaps back or closes on release. Styles are written directly so the
  // gesture never re-renders.
  const onHandleDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    drag.current = { startY: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    const el = dialogRef.current;
    if (el) el.style.transition = "none";
  };
  const onHandleMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = dialogRef.current;
    if (!d || !el) return;
    d.dy = Math.max(0, e.clientY - d.startY);
    el.style.transform = `translateY(${d.dy}px)`;
  };
  const onHandleUp = () => {
    const d = drag.current;
    const el = dialogRef.current;
    drag.current = null;
    if (!d || !el) return;
    el.style.transform = "";
    el.style.transition = "";
    if (d.dy > SWIPE_CLOSE) onOpenChange(false);
  };

  return (
    <DialogBase
      open={open}
      onOpenChange={onOpenChange}
      dialogRef={dialogRef}
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
      side={phone ? "bottom" : side}
      style={{ "--drawer-w": width } as CSSProperties}
      className={clsx(
        "rounded-lg",
        SIDE[side],
        // Phones: bottom sheet, full width, most of the height at most.
        "max-sm:mx-0 max-sm:mt-auto max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:max-h-[90dvh] max-sm:rounded-t-xl max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0",
        className,
      )}
    >
      <div
        aria-hidden
        className="flex shrink-0 justify-center py-2 sm:hidden [touch-action:none]"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleUp}
      >
        <span className="h-1 w-10 rounded-full bg-rule-strong" />
      </div>
      <header className={clsx("flex items-start gap-3 px-5 pb-3", hideTitle ? "pt-3" : "pt-4 sm:pt-5")}>
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
          className="-mr-2 -mt-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-muted hover:text-ink"
        >
          <X size={16} aria-hidden />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 text-sm">{children}</div>
      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-rule px-5 py-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {footer}
        </footer>
      )}
    </DialogBase>
  );
}

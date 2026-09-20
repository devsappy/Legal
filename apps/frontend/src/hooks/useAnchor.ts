"use client";

import { useLayoutEffect, type RefObject } from "react";

export type AnchorSide = "top" | "bottom" | "left" | "right";
export type AnchorAlign = "start" | "center" | "end";

type Opts = {
  /** Preferred side of the anchor; flips to the opposite side when clipped. */
  side?: AnchorSide;
  /** Which edge of the anchor the floating node lines up with. */
  align?: AnchorAlign;
  /** Gap between anchor and node, in px. */
  gutter?: number;
  /** Positioning only runs while open, so closed nodes cost nothing. */
  open: boolean;
};

const OPPOSITE: Record<AnchorSide, AnchorSide> = { top: "bottom", bottom: "top", left: "right", right: "left" };

/** Breathing room kept between a floating node and the viewport edge. */
const VIEWPORT_PAD = 8;

/**
 * Pins a floating node (tooltip, menu, popover) next to an anchor element.
 * Coordinates are written straight to the node's style inside a layout
 * effect — never through React state — so opening never causes a second
 * render and the React Compiler rules stay happy. The node must already be
 * in the DOM (portalled) and sized; it becomes `position: fixed`, which is
 * why floating layers portal to <body> and measure against the viewport.
 *
 * Recomputes on capture-phase scroll (the app's <main> is the only scroll
 * container, so bubbling scroll events would never reach window), on
 * resize, and whenever either box changes size. The resolved side is
 * exposed as `data-side` on the node for arrow or origin styling.
 */
export function useAnchor(
  ref: RefObject<HTMLElement | null>,
  anchor: RefObject<HTMLElement | null> | null,
  { side = "bottom", align = "start", gutter = 8, open }: Opts,
): void {
  useLayoutEffect(() => {
    const node = ref.current;
    const target = anchor?.current;
    if (!open || !node || !target) return;

    const update = () => {
      const a = target.getBoundingClientRect();
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Flip when the preferred side has no room but the opposite one has more.
      const room: Record<AnchorSide, number> = {
        top: a.top - gutter,
        bottom: vh - a.bottom - gutter,
        left: a.left - gutter,
        right: vw - a.right - gutter,
      };
      let s = side;
      const need = s === "top" || s === "bottom" ? h : w;
      if (room[s] < need && room[OPPOSITE[s]] > room[s]) s = OPPOSITE[s];

      let top: number;
      let left: number;
      if (s === "top" || s === "bottom") {
        top = s === "top" ? a.top - gutter - h : a.bottom + gutter;
        left = align === "start" ? a.left : align === "end" ? a.right - w : a.left + a.width / 2 - w / 2;
      } else {
        left = s === "left" ? a.left - gutter - w : a.right + gutter;
        top = align === "start" ? a.top : align === "end" ? a.bottom - h : a.top + a.height / 2 - h / 2;
      }

      // Slide along the cross axis so the node never leaves the viewport.
      left = Math.min(Math.max(left, VIEWPORT_PAD), Math.max(VIEWPORT_PAD, vw - w - VIEWPORT_PAD));
      top = Math.min(Math.max(top, VIEWPORT_PAD), Math.max(VIEWPORT_PAD, vh - h - VIEWPORT_PAD));

      node.style.position = "fixed";
      node.style.top = `${Math.round(top)}px`;
      node.style.left = `${Math.round(left)}px`;
      node.dataset.side = s;
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    ro?.observe(node);
    ro?.observe(target);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [ref, anchor, side, align, gutter, open]);
}

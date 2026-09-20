"use client";

import { useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import clsx from "clsx";
import { Link, usePathname } from "@/i18n/navigation";

export type TabItem = {
  value: string;
  label: string;
  /** Right-hand count pill. */
  count?: number;
  /** Route tab: renders a Link with aria-current instead of a tab button. */
  href?: string;
  icon?: ReactNode;
};

type Props = {
  ariaLabel: string;
  items: TabItem[];
  /** Selected value. Route tabs derive it from the pathname when omitted. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Panels are `${idPrefix}-panel-${value}` and tabs `${idPrefix}-tab-${value}`. */
  idPrefix?: string;
  className?: string;
};

const KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);
/* ASCII unit separator for the layout key; never appears in a label. */
const SEP = String.fromCharCode(31);

/**
 * Underlined tabs in two modes. Panel mode (no hrefs) is a WAI-ARIA
 * tablist with roving tabindex and automatic activation on arrow keys;
 * consumers render `<div role="tabpanel" id="{idPrefix}-panel-{value}"
 * aria-labelledby="{idPrefix}-tab-{value}">`. Route mode (hrefs) is a
 * <nav> of links with aria-current="page", because links that navigate
 * must not be announced as tabs. The ink underline is one element that
 * slides between items; its position is written straight to the DOM in
 * useLayoutEffect (no state in effects).
 */
export function Tabs({ ariaLabel, items, value, onValueChange, idPrefix, className }: Props) {
  const autoId = useId();
  const prefix = idPrefix ?? `tabs${autoId}`;
  // Typed as a string, but null when rendered outside the app router (tests, previews).
  const pathname: string = usePathname() ?? "";
  const routeMode = items.some((it) => it.href);

  const selected =
    value ??
    (routeMode
      ? (items.find((it) => it.href && (pathname === it.href || pathname.startsWith(`${it.href}/`)))?.value ??
        items[0]?.value)
      : items[0]?.value);

  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  // Anything that changes an item's width (label on locale switch, count)
  // must re-measure; a string key avoids re-running on every new array.
  const layoutKey = items.map((it) => [it.value, it.label, it.count ?? ""].join(SEP)).join(SEP);

  // Measure the selected item and slide the underline under it. Runs before
  // paint, so the first frame is already in place; ResizeObserver covers
  // font loading and container resizes.
  useLayoutEffect(() => {
    const list = listRef.current;
    const bar = barRef.current;
    if (!list || !bar) return;

    const place = () => {
      const el = list.querySelector<HTMLElement>(`[data-tab="${CSS.escape(selected ?? "")}"]`);
      if (!el) {
        bar.style.transform = "scaleX(0)";
        return;
      }
      bar.style.transform = `translateX(${el.offsetLeft}px) scaleX(${el.offsetWidth})`;
      if (!bar.dataset.ready) {
        // Commit the first position without a transition, then enable it.
        void bar.offsetWidth;
        bar.dataset.ready = "1";
      }
    };
    place();

    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => ro.disconnect();
  }, [selected, layoutKey]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!KEYS.has(e.key) || items.length === 0) return;
    const focusables = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-tab]") ?? []);
    const current = focusables.findIndex((el) => el === document.activeElement);
    const from = current === -1 ? focusables.findIndex((el) => el.dataset.tab === selected) : current;
    let next = from;
    if (e.key === "ArrowLeft") next = (from - 1 + focusables.length) % focusables.length;
    if (e.key === "ArrowRight") next = (from + 1) % focusables.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = focusables.length - 1;
    e.preventDefault();
    const target = focusables[next];
    target?.focus();
    // Automatic activation for panel tabs; route tabs activate with Enter like any link.
    if (!routeMode && target?.dataset.tab !== undefined) onValueChange?.(target.dataset.tab);
  };

  const itemClass = (active: boolean) =>
    clsx(
      "relative inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm px-1 text-sm font-medium transition-colors",
      active ? "text-ink" : "text-ink-2 hover:text-ink",
    );

  // The global :focus-visible ring is unlayered, so a utility cannot move
  // it; an inline offset pulls it inside the item, clear of the scroll
  // wrapper's clipping edge.
  const ringInset = { outlineOffset: -2 } as const;

  const countPill = (count: number, active: boolean) => (
    <span
      className={clsx(
        "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 font-mono text-2xs tabular-nums leading-none",
        active ? "bg-ink text-paper" : "bg-muted text-ink-2",
      )}
    >
      {count}
    </span>
  );

  const list = (
    <div
      ref={listRef}
      role={routeMode ? undefined : "tablist"}
      aria-label={routeMode ? undefined : ariaLabel}
      onKeyDown={onKeyDown}
      className="relative flex min-w-max items-stretch gap-4"
    >
      {items.map((it) => {
        const active = it.value === selected;
        const content = (
          <>
            {it.icon && (
              <span className="shrink-0" aria-hidden>
                {it.icon}
              </span>
            )}
            {it.label}
            {it.count !== undefined && countPill(it.count, active)}
          </>
        );
        if (it.href) {
          return (
            <Link
              key={it.value}
              href={it.href}
              data-tab={it.value}
              aria-current={active ? "page" : undefined}
              className={itemClass(active)}
              style={ringInset}
            >
              {content}
            </Link>
          );
        }
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            id={`${prefix}-tab-${it.value}`}
            aria-selected={active}
            aria-controls={`${prefix}-panel-${it.value}`}
            tabIndex={active ? 0 : -1}
            data-tab={it.value}
            onClick={() => onValueChange?.(it.value)}
            className={itemClass(active)}
            style={ringInset}
          >
            {content}
          </button>
        );
      })}
      <span
        ref={barRef}
        className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-px origin-left bg-ink data-ready:transition-transform data-ready:duration-(--dur-2) data-ready:ease-(--ease-standard) motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
        style={{ transform: "scaleX(0)" }}
        data-motion
        aria-hidden
      />
    </div>
  );

  // The scroll wrapper keeps long tab rows usable at 390px; the hairline
  // sits on the wrapper so it spans the full width, not just the items.
  const wrapper = clsx("scroll-thin overflow-x-auto border-b border-rule", className);
  return routeMode ? (
    <nav aria-label={ariaLabel} className={wrapper}>
      {list}
    </nav>
  ) : (
    <div className={wrapper}>{list}</div>
  );
}

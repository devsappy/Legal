"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  /** Milliseconds to wait once in view, for sequencing siblings. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "ul" | "ol" | "dl" | "figure";
  style?: CSSProperties;
  /**
   * Above-the-fold content: rendered already visible (`is-in`) with the
   * server-side `.reveal-eager` keyframe entrance instead of waiting for the
   * IntersectionObserver, so the hero reads before JavaScript arrives and
   * stays the LCP element.
   */
  eager?: boolean;
  id?: string;
};

/**
 * Fades and lifts its content in the first time it scrolls into view.
 * Direct children of any [data-stagger] element inside follow one by one.
 */
export function Reveal({ children, delay = 0, className, as = "div", style, eager = false, id }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Every allowed tag accepts the same props; narrow to one for the JSX type.
  const Tag = as as "div";

  useEffect(() => {
    const el = ref.current;
    if (!el || eager) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-in");
        io.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement>}
      id={id}
      className={clsx("reveal", eager && "is-in reveal-eager", className)}
      style={{ "--reveal-d": `${delay}ms`, ...style } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

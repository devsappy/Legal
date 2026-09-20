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
};

/**
 * Fades and lifts its content in the first time it scrolls into view.
 * Direct children of any [data-stagger] element inside follow one by one.
 */
export function Reveal({ children, delay = 0, className, as = "div", style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Every allowed tag accepts the same props; narrow to one for the JSX type.
  const Tag = as as "div";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
  }, []);

  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement>}
      className={clsx("reveal", className)}
      style={{ "--reveal-d": `${delay}ms`, ...style } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

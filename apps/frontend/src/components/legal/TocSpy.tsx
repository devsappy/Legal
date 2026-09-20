"use client";

import { useEffect } from "react";

/** Headings closer to the top than this count as "reached" (below the sticky public header). */
const OFFSET = 120;

/**
 * Marks the "On this page" link of the section being read. Observes the
 * article's h2[id] elements and writes aria-current="location" on the
 * matching nav link directly (no React state, so the article never
 * re-renders while scrolling); the nav styles the attribute. The active
 * heading is the last one whose top has passed the offset, which also
 * works for short final sections that never reach the top.
 */
export function TocSpy({ article, nav }: { article: string; nav: string }) {
  useEffect(() => {
    const root = document.getElementById(article);
    const navEl = document.getElementById(nav);
    if (!root || !navEl) return;

    const headings = Array.from(root.querySelectorAll<HTMLElement>("h2[id]"));
    const links = new Map<string, HTMLAnchorElement>();
    for (const a of navEl.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      let id = a.getAttribute("href")?.slice(1) ?? "";
      try {
        id = decodeURIComponent(id);
      } catch {
        /* keep as is */
      }
      if (id) links.set(id, a);
    }
    if (headings.length === 0 || links.size === 0) return;

    let active: string | null = null;
    const mark = (id: string | null) => {
      if (id === active) return;
      if (active) links.get(active)?.removeAttribute("aria-current");
      if (id) links.get(id)?.setAttribute("aria-current", "location");
      active = id;
    };

    const update = () => {
      let current: HTMLElement | null = null;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= OFFSET) current = h;
        else break;
      }
      // Above the first heading nothing is "current" except the first section itself.
      mark((current ?? headings[0]).id);
    };

    const io = new IntersectionObserver(update, {
      // Fire whenever a heading crosses the band between the offset and the lower half.
      rootMargin: `-${OFFSET}px 0px -50% 0px`,
      threshold: [0, 1],
    });
    headings.forEach((h) => io.observe(h));
    update();

    // Hash navigation and resizes move headings without an intersection change.
    window.addEventListener("hashchange", update);
    window.addEventListener("resize", update);
    return () => {
      io.disconnect();
      window.removeEventListener("hashchange", update);
      window.removeEventListener("resize", update);
      mark(null);
    };
  }, [article, nav]);

  return null;
}

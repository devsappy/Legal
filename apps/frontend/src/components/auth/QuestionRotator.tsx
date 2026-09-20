"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

const EVERY = 5_000;

function motionReduced(): boolean {
  return (
    document.documentElement.dataset.motion === "reduced" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Cycles through sample questions on the ink panel of the auth pages: one
 * every five seconds with a 300 ms opacity crossfade. All items share one
 * grid cell so the block keeps the height of the longest question and
 * nothing below it jumps. Under reduced motion (OS or Settings) the first
 * question stays put. The list is decorative for readers: only the current
 * item is exposed, and the region is not live.
 */
export function QuestionRotator({ questions, className }: { questions: string[]; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (questions.length < 2 || motionReduced()) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer !== null) return;
      timer = setInterval(() => setIndex((i) => (i + 1) % questions.length), EVERY);
    };
    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [questions.length]);

  if (questions.length === 0) return null;

  return (
    <div className={clsx("grid", className)}>
      {questions.map((q, i) => {
        const active = i === index;
        return (
          <p
            key={q}
            data-motion
            aria-hidden={!active}
            className={clsx(
              "col-start-1 row-start-1 text-lg leading-snug text-balance transition-opacity duration-300 ease-standard",
              "motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none",
              active ? "opacity-100" : "pointer-events-none opacity-0 select-none",
            )}
          >
            “{q}”
          </p>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useEffectEvent, useRef, useState, type FocusEvent, type PointerEvent } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefs } from "@/lib/prefs";
import { SCENES } from "./HowScenes";

export type HowStep = { title: string; body: string; points: string[] };

/** How long each step stays before the next one takes over. */
const DWELL_MS = 7000;
const ID = "how";

type Props = {
  steps: HowStep[];
  /** Accessible name of the tab list. */
  label: string;
};

/**
 * The three steps as tabs (Tabs primitive: roving focus, arrow keys,
 * automatic activation). A hairline under the list fills over seven
 * seconds and then advances to the next step; it only runs while the box
 * is on screen and nobody is hovering or focused inside it, and never
 * under reduced motion. The fill is written straight to the bar's
 * transform from one requestAnimationFrame loop, and elapsed time
 * survives a pause, so resuming continues rather than restarting.
 */
export function HowTabs({ steps, label }: Props) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const osReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const prefs = usePrefs();
  const reduced = osReduced || prefs.reduceMotion;

  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const elapsed = useRef(0);

  const running = visible && !hovered && !focused && !reduced && steps.length > 1;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const advance = useEffectEvent(() => setActive((i) => (i + 1) % steps.length));

  // A new step starts its own countdown from zero.
  useEffect(() => {
    elapsed.current = 0;
    if (bar.current) bar.current.style.transform = "scaleX(0)";
  }, [active]);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const p = Math.min(1, elapsed.current / DWELL_MS);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (p >= 1) {
        elapsed.current = 0;
        advance();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, active]);

  const onPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") setHovered(true);
  };
  const onPointerLeave = () => setHovered(false);
  const onFocus = () => setFocused(true);
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  const step = steps[active] ?? steps[0];
  const Scene = SCENES[active % SCENES.length];
  const value = String(active);

  return (
    <div
      ref={root}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      className="flex min-w-0 flex-col bg-sheet"
    >
      <div className="relative px-5 pt-3 sm:px-6">
        <Tabs
          ariaLabel={label}
          idPrefix={ID}
          value={value}
          onValueChange={(v) => setActive(Number(v))}
          items={steps.map((s, i) => ({
            value: String(i),
            label: s.title,
            icon: <span className="font-mono text-2xs font-semibold text-ink-3">{String(i + 1).padStart(2, "0")}</span>,
          }))}
        />
        {/* Countdown to the next step, drawn over the tab list's hairline. */}
        <span
          ref={bar}
          data-motion
          aria-hidden
          className={clsx(
            "pointer-events-none absolute bottom-0 left-5 right-5 h-px origin-left bg-ink sm:left-6 sm:right-6",
            reduced && "hidden",
          )}
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      <div
        key={active}
        role="tabpanel"
        id={`${ID}-panel-${value}`}
        aria-labelledby={`${ID}-tab-${value}`}
        data-motion
        className="grid flex-1 gap-6 p-5 animate-[rise_200ms_cubic-bezier(0.2,0.7,0.2,1)_both] motion-reduce:animate-none [html[data-motion=reduced]_&]:animate-none sm:p-6 md:grid-cols-2 md:gap-8"
      >
        <div className="min-w-0">
          <h3 className="text-xl text-ink">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.body}</p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {step.points.map((pt) => (
              <li key={pt} className="flex gap-2.5 text-sm leading-snug text-ink-2">
                <span className="mt-0.5 inline-flex size-4.5 shrink-0 items-center justify-center rounded-sm bg-ink text-paper" aria-hidden>
                  <Check size={11} strokeWidth={3} />
                </span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 self-center text-ink-2">
          <Scene />
        </div>
      </div>
    </div>
  );
}

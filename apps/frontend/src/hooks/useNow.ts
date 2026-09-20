"use client";

import { useSyncExternalStore } from "react";
import { currentMinute } from "@/lib/greeting";

const subscribe = () => () => {};

/**
 * The current time for rendering, as an external store so components stay
 * pure: the server's clock on the first paint (so hydration matches), then
 * the visitor's clock, rounded to the minute so the snapshot is stable
 * between renders.
 */
export function useNow(serverNow: number): number {
  return useSyncExternalStore(subscribe, currentMinute, () => serverNow);
}

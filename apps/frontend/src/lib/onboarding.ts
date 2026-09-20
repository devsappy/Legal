"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { readPersisted, usePersisted, writePersisted } from "@/hooks/usePersisted";

/**
 * First-run state. The dashboard's WelcomeCard writes it; the Ask page reads
 * it for its "finish setting up" strip. `plan` is what the visitor picked on
 * the pricing tiles (?plan= on /register) — indicative only, billing is not live.
 */
const ONBOARDED_KEY = "coop.onboarded";
const PLAN_KEY = "coop.plan";

export type Onboarding = {
  onboarded: boolean;
  plan: string | null;
  /** False until the stored values are readable; render nothing that depends on them before then. */
  hydrated: boolean;
};

export function useOnboarding(): Onboarding {
  const [onboarded] = usePersisted<boolean>(ONBOARDED_KEY, false);
  const [plan] = usePersisted<string | null>(PLAN_KEY, null);
  const hydrated = useHydrated();
  return { onboarded, plan, hydrated };
}

export function setOnboarded(v: boolean): void {
  writePersisted(ONBOARDED_KEY, v);
}

export function setPlan(p: string | null): void {
  writePersisted(PLAN_KEY, p);
}

export function isOnboarded(): boolean {
  return readPersisted<boolean>(ONBOARDED_KEY, false);
}

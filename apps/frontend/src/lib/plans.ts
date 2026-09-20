/**
 * Pricing tiers shown on the landing page. Copy (names, feature lists, CTA
 * labels) lives under `landing.pricing.plans.<id>` in the message files;
 * this module only holds the numbers and where each call to action goes.
 *
 * Billing is not live: every amount is indicative for the pilot and the
 * page says so. `amount` is rupees per society per year; null means
 * "talk to us" and the CTA is a mailto to `landing.pricing.contactEmail`.
 */
export type PlanId = "member" | "society" | "federation";

export type Plan = {
  id: PlanId;
  /** Rupees per year; 0 is free, null is quoted on request. */
  amount: number | null;
  /** Rendered inverted (ink on paper) with the "Pilot" stamp. */
  recommended?: boolean;
  /** Locale-relative registration link, or null for the mailto plan. */
  href: string | null;
};

export const PLANS: readonly Plan[] = [
  { id: "member", amount: 0, href: "/register?plan=member" },
  { id: "society", amount: 6000, recommended: true, href: "/register?plan=society" },
  { id: "federation", amount: null, href: null },
];

/** The ISO 4217 code used when the amount is formatted. */
export const PLAN_CURRENCY = "INR";

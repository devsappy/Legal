/**
 * Client-side rules for the sign-in and registration forms. They mirror
 * what the backend's register() accepts so a form that passes here is not
 * bounced with a 400. Each rule returns a key under `auth.validation.*`
 * (translated at the call site) or null when the value is fine.
 */
export type ValidationError = "required" | "email" | "minLength" | "name";

export type Validator = (value: string) => ValidationError | null;

export const PASSWORD_MIN = 6;
export const NAME_MIN = 2;
export const NAME_MAX = 80;

/** Same shape the backend checks: something@something.something, no spaces. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const required: Validator = (value) => (value.trim() ? null : "required");

export const email: Validator = (value) => required(value) ?? (EMAIL.test(value.trim()) ? null : "email");

export function minLength(min: number): Validator {
  return (value) => required(value) ?? (value.length >= min ? null : "minLength");
}

export const name: Validator = (value) => {
  const n = value.trim();
  return required(value) ?? (n.length >= NAME_MIN && n.length <= NAME_MAX ? null : "name");
};

/** Runs every rule of a form and returns the first error per field (null when clean). */
export function validateAll<K extends string>(
  values: Record<K, string>,
  rules: Record<K, Validator>,
): Record<K, ValidationError | null> {
  const out = {} as Record<K, ValidationError | null>;
  for (const key of Object.keys(rules) as K[]) out[key] = rules[key](values[key] ?? "");
  return out;
}

export function hasErrors(errors: Record<string, ValidationError | null>): boolean {
  return Object.values(errors).some((e) => e !== null);
}

export type Strength = 0 | 1 | 2 | 3 | 4;

/**
 * A coarse 0–4 score for the registration meter: length past the minimum,
 * length past ten, letters mixed with digits, and either mixed case or a
 * symbol. Empty input scores 0. Labels: 0–1 weak, 2–3 fair, 4 strong.
 */
export function passwordStrength(value: string): Strength {
  if (!value) return 0;
  let score = 0;
  if (value.length >= PASSWORD_MIN) score++;
  if (value.length >= 10) score++;
  if (/\p{L}/u.test(value) && /\p{N}/u.test(value)) score++;
  if ((/\p{Lu}/u.test(value) && /\p{Ll}/u.test(value)) || /[^\p{L}\p{N}\s]/u.test(value)) score++;
  return score as Strength;
}

export function strengthLabel(score: Strength): "weak" | "fair" | "strong" {
  if (score >= 4) return "strong";
  if (score >= 2) return "fair";
  return "weak";
}

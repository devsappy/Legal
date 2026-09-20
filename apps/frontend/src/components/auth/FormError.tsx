"use client";

import { useTranslations } from "next-intl";
import { CircleAlert, WifiOff } from "lucide-react";

/**
 * What went wrong with a sign-in or registration request, mapped from the
 * response: 401 -> credentials, 409 -> exists, 400 -> invalid, and a fetch
 * that threw (or a null response) -> network.
 */
export type FormErrorKind = "credentials" | "network" | "exists" | "invalid";

export function errorKindFor(res: Response | null, fallback: FormErrorKind = "invalid"): FormErrorKind {
  if (!res) return "network";
  if (res.status === 401) return "credentials";
  if (res.status === 409) return "exists";
  if (res.status === 400) return "invalid";
  if (res.status >= 500 || res.status === 0) return "network";
  return fallback;
}

/**
 * The form-level error strip: seal outline on the soft seal tint, announced
 * as an alert. The message copy is separate per kind so a wrong password
 * never reads like an outage.
 */
export function FormError({ kind }: { kind: FormErrorKind | null }) {
  const t = useTranslations("auth.errors");
  if (!kind) return null;
  const Icon = kind === "network" ? WifiOff : CircleAlert;
  return (
    <p
      role="alert"
      data-motion
      className="rise flex items-start gap-2.5 rounded-lg border border-seal/30 bg-seal-soft px-3 py-2.5 text-sm text-ink"
    >
      <Icon size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-seal" aria-hidden />
      <span>{t(kind)}</span>
    </p>
  );
}

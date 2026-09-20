"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useOnboarding } from "@/lib/onboarding";

/**
 * One line for a visitor who has not finished the Home set-up. The dashboard
 * owns the WelcomeCard; this only points to it, and only after hydration so
 * the server and first client paint agree.
 */
export function FirstRunStrip() {
  const t = useTranslations("chat");
  const { onboarded, hydrated } = useOnboarding();
  if (!hydrated || onboarded) return null;

  return (
    <p className="rise mt-5 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-rule bg-sheet px-3.5 py-1.5 text-xs text-ink-2" data-motion>
      <Sparkles size={13} className="shrink-0 text-ink" aria-hidden />
      <span>{t("firstRun")}</span>
      <Link href="/home" className="inline-flex items-center gap-0.5 font-medium text-ink underline-offset-4 hover:underline">
        {t("firstRunLink")}
        <ArrowUpRight size={12} aria-hidden />
      </Link>
    </p>
  );
}

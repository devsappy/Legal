"use client";

import { useTranslations } from "next-intl";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import type { MessageContext } from "@/lib/types";

/** True when two turns were answered from a different Act or language. */
export function contextDiffers(a: MessageContext | undefined, b: MessageContext | undefined): boolean {
  if (!a || !b) return false;
  return a.jurisdiction !== b.jurisdiction || a.language !== b.language;
}

/**
 * Hairline note between turns when the Act or language changed, so an
 * older answer is never read against the wrong statute.
 */
export function ContextDivider({ context }: { context: MessageContext }) {
  const t = useTranslations("chat");
  const act = JURISDICTIONS.find((j) => j.id === context.jurisdiction)?.short ?? context.jurisdiction;
  const language = LANGUAGES.find((l) => l.code === context.language)?.native ?? context.language;
  const label = t("contextChanged", { act, language });

  return (
    <div role="separator" aria-label={label} className="flex items-center gap-3" data-print="expand">
      <span className="h-px flex-1 bg-rule-strong" aria-hidden />
      <span className="rounded-full border border-rule bg-sheet px-2.5 py-0.5 font-mono text-2xs tracking-wide text-ink-2">
        {label}
      </span>
      <span className="h-px flex-1 bg-rule-strong" aria-hidden />
    </div>
  );
}

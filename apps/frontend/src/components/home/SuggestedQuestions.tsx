"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { JURISDICTIONS } from "@/lib/config";
import { askHref } from "@/lib/routes";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";

/**
 * Four starter questions phrased for the Act the visitor has chosen. Each
 * is a link into the assistant with the question and the Act in the URL,
 * so the composer is pre-filled and the right Act is selected on arrival.
 */
export function SuggestedQuestions() {
  const t = useTranslations("home");
  const { jurisdiction } = useJurisdiction();
  const act = JURISDICTIONS.find((j) => j.id === jurisdiction) ?? JURISDICTIONS[0];
  const questions = (t.raw("suggestions") as string[]).map((s) => s.replace(/\{act\}/g, act.short));

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-base font-medium text-ink">{t("suggestionsTitle")}</h2>
      <p className="mt-1 text-xs text-ink-3">{t("suggestionsBody", { act: act.act })}</p>
      <ul className="mt-3 -mx-2 flex flex-col">
        {questions.map((q) => (
          <li key={q}>
            <Link
              href={askHref({ q, jurisdiction })}
              className="group/q flex items-start gap-2.5 rounded-md px-2 py-2 text-sm text-ink-2 transition-colors hover:bg-muted hover:text-ink"
              style={{ outlineOffset: -2 }}
            >
              <span className="flex-1 text-pretty">{q}</span>
              <ArrowRight
                size={14}
                className="mt-1 shrink-0 text-ink-3 transition-transform group-hover/q:translate-x-0.5 motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

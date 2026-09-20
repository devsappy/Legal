"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import clsx from "clsx";

type Props = {
  n: number;
  title: string;
  checked: boolean;
  onChange: () => void;
  /** Id of the element describing the step, for aria-describedby. */
  describedBy?: string;
};

/**
 * A real checkbox (Space toggles, forms and readers work) drawn as the
 * numbered circle of the timeline. Checked = ink circle with a paper tick
 * and the title struck through.
 */
export function StepCheckbox({ n, title, checked, onChange, describedBy }: Props) {
  const t = useTranslations("checklists");
  return (
    <label className="group/step flex cursor-pointer items-start gap-3">
      <span className="relative mt-px inline-flex size-7 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-label={t("markDone", { n, title })}
          aria-describedby={describedBy}
          className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-full"
        />
        <span
          aria-hidden
          className={clsx(
            "pointer-events-none absolute inset-0 flex items-center justify-center rounded-full border font-mono text-2xs transition-colors duration-(--dur-2)",
            checked ? "border-ink bg-ink text-paper" : "border-rule-strong bg-sheet text-ink group-hover/step:border-ink",
          )}
        >
          {checked ? <Check size={14} strokeWidth={3} /> : n}
        </span>
      </span>
      <span
        className={clsx(
          "min-w-0 flex-1 font-sans text-[16px] font-medium leading-snug transition-colors duration-(--dur-2)",
          checked ? "text-ink-3 line-through decoration-ink-3/60" : "text-ink",
        )}
      >
        {title}
      </span>
    </label>
  );
}

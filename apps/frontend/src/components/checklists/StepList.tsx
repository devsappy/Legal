"use client";

import { useTranslations } from "next-intl";
import { CalendarClock, FileText, IndianRupee, Link2 } from "lucide-react";
import clsx from "clsx";
import { IconButton } from "@/components/ui/IconButton";
import { copyText } from "@/lib/clipboard";
import { toggleStep, useProgress } from "@/lib/progress";
import { toast } from "@/lib/toast";
import { AskAboutStep } from "./AskAboutStep";
import { StepCheckbox } from "./StepCheckbox";

/** A step with its copy already picked for the reader's locale. */
export type StepView = {
  title: string;
  detail: string;
  forms?: string[];
  deadline?: string;
  fee?: string;
};

type Props = {
  slug: string;
  procedureTitle: string;
  jurisdiction: string;
  steps: StepView[];
};

/**
 * The numbered timeline. Each step is a checkbox that persists per device
 * (coop.progress), carries a #step-n anchor with a copy-link button, and
 * can be handed to the assistant as a question.
 */
export function StepList({ slug, procedureTitle, jurisdiction, steps }: Props) {
  const t = useTranslations("checklists");
  const done = useProgress(slug);

  const copyLink = async (n: number) => {
    const url = `${window.location.origin}${window.location.pathname}#step-${n}`;
    const ok = await copyText(url);
    if (ok) toast.success(t("linkCopied"));
    else toast.error(t("copyFailed"));
  };

  return (
    <ol className="relative ml-3.5 space-y-8 border-l border-rule" data-print="expand">
      {steps.map((s, i) => {
        const n = i + 1;
        const checked = done.includes(i);
        const detailId = `step-${n}-detail`;
        return (
          <li
            key={n}
            id={`step-${n}`}
            className={clsx("relative -ml-[15px] scroll-mt-6 transition-opacity duration-(--dur-2) [&:target>div]:bg-muted/50", checked && "print:opacity-70")}
            data-print="expand"
          >
            <div className="rounded-lg py-1 pr-2 transition-colors duration-(--dur-3)">
              <StepCheckbox n={n} title={s.title} checked={checked} onChange={() => toggleStep(slug, i)} describedBy={detailId} />
              <div className="pl-10">
                <p id={detailId} className={clsx("mt-1 max-w-[62ch] text-[14.5px] transition-colors", checked ? "text-ink-3" : "text-ink-2")}>
                  {s.detail}
                </p>
                {(s.forms || s.deadline || s.fee) && (
                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                    {s.forms && (
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">{t("forms")}</dt>
                        <FileText size={13} className="text-ink-3" aria-hidden />
                        <dd className="font-mono text-ink">{s.forms.join(", ")}</dd>
                      </div>
                    )}
                    {s.deadline && (
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">{t("deadline")}</dt>
                        <CalendarClock size={13} className="text-seal" aria-hidden />
                        <dd className="text-ink">{s.deadline}</dd>
                      </div>
                    )}
                    {s.fee && (
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">{t("fee")}</dt>
                        <IndianRupee size={13} className="text-ink-3" aria-hidden />
                        <dd className="text-ink">{s.fee}</dd>
                      </div>
                    )}
                  </dl>
                )}
                <div className="mt-2 -ml-2 flex flex-wrap items-center gap-0.5" data-print="hide">
                  <AskAboutStep procedure={procedureTitle} n={n} step={s.title} jurisdiction={jurisdiction} />
                  <IconButton size="sm" label={t("copyLink")} onClick={() => void copyLink(n)} className="text-ink-3">
                    <Link2 size={14} aria-hidden />
                  </IconButton>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { CheckCheck, RotateCcw } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Meter } from "@/components/ui/Meter";
import { resetProgress, useProgress } from "@/lib/progress";
import { toast } from "@/lib/toast";

type Props = {
  slug: string;
  total: number;
};

/**
 * "n of N done" for the sticky aside: a Meter, the Completed badge once
 * every step is ticked, and Reset / Start over behind a confirmation
 * (it is destructive on this device's record, so it asks first).
 */
export function ProcedureProgress({ slug, total }: Props) {
  const t = useTranslations("checklists");
  const confirm = useConfirm();
  const done = useProgress(slug).filter((i) => i < total).length;
  const complete = total > 0 && done >= total;

  const reset = async () => {
    const ok = await confirm({ title: t("resetTitle"), body: t("resetBody"), confirmLabel: t("reset"), destructive: true });
    if (!ok) return;
    resetProgress(slug);
    toast.success(t("resetDone"));
  };

  return (
    <div className="flex flex-col gap-3" data-print="hide">
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xs uppercase tracking-[0.08em] text-ink-3">{t("progress")}</span>
        {complete && (
          <Badge kind="solid" className="gap-1">
            <CheckCheck size={11} strokeWidth={2.5} aria-hidden /> {t("completed")}
          </Badge>
        )}
      </div>
      <Meter value={total > 0 ? done / total : 0} label={t("doneOf", { done, total })} />
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs tabular-nums text-ink-2" aria-live="polite">
          {t("doneOf", { done, total })}
        </span>
        {done > 0 && (
          <Button size="xs" variant="ghost" onClick={() => void reset()} className="text-ink-3 hover:text-ink">
            <RotateCcw size={12} aria-hidden /> {complete ? t("startOver") : t("reset")}
          </Button>
        )}
      </div>
    </div>
  );
}

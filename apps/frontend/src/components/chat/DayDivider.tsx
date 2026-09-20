"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";

const DAY = 86_400_000;
const never = () => () => {};
const todayKey = () => dayKey(Date.now());
const yesterdayKey = () => dayKey(Date.now() - DAY);

/** Midnight boundary of the day `ts` falls in, for grouping messages. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** A mono date rule between messages from different days: "Today", "Yesterday", or the date. */
export function DayDivider({ ts }: { ts: number }) {
  const t = useTranslations("chat");
  const locale = useLocale();
  // The clock is read through a store so render stays pure (it never ticks; a reopen re-reads it).
  const today = useSyncExternalStore(never, todayKey, todayKey);
  const yesterday = useSyncExternalStore(never, yesterdayKey, yesterdayKey);
  const key = dayKey(ts);
  const label = key === today ? t("today") : key === yesterday ? t("yesterday") : formatDate(ts, locale, "medium");

  return (
    <div role="separator" aria-label={label} className="flex items-center gap-3" data-print="expand">
      <span className="h-px flex-1 bg-rule" aria-hidden />
      <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{label}</span>
      <span className="h-px flex-1 bg-rule" aria-hidden />
    </div>
  );
}

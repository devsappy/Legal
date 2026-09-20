"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, ListChecks, MessageSquareText, Moon, Scale } from "lucide-react";
import clsx from "clsx";
import { Link } from "@/i18n/navigation";
import { DEFAULT_JURISDICTION } from "@/lib/config";
import { useHistory } from "@/lib/history";
import { useOnboarding } from "@/lib/onboarding";
import { useAllProgress } from "@/lib/progress";
import { askHref } from "@/lib/routes";
import { formatNumber } from "@/lib/format";
import { usePersisted } from "@/hooks/usePersisted";
import { useHydrated } from "@/hooks/useHydrated";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { applyTheme, useTheme } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Meter } from "@/components/ui/Meter";

const KEY = "coop.gettingStarted.dismissed";

type Props = {
  /** Grid placement and entrance classes from the page; the tile chrome is added here so nothing renders while hidden. */
  className?: string;
};

/**
 * Four tasks that tick themselves off as the app is used. It steps aside
 * while the first-run WelcomeCard is up, and disappears for good once
 * every task is done or the visitor dismisses it.
 */
export function GettingStarted({ className }: Props) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const hydrated = useHydrated();
  const [dismissed, setDismissed] = usePersisted<boolean>(KEY, false);
  const { onboarded } = useOnboarding();
  const history = useHistory();
  const progress = useAllProgress();
  const { jurisdiction } = useJurisdiction();
  const { mode } = useTheme();

  const tasks = [
    { key: "ask", done: history.length > 0, icon: MessageSquareText, href: askHref() },
    { key: "procedure", done: Object.keys(progress).length > 0, icon: ListChecks, href: "/checklists" },
    { key: "act", done: jurisdiction !== DEFAULT_JURISDICTION, icon: Scale, href: "/settings/preferences" },
    { key: "theme", done: mode !== "light", icon: Moon, href: null },
  ] as const;
  const done = tasks.filter((x) => x.done).length;

  const welcomeShowing = !onboarded && history.length === 0;
  if (!hydrated || dismissed || welcomeShowing || done === tasks.length) return null;

  return (
    <section
      aria-labelledby="getting-started-title"
      className={clsx("tile flex min-w-0 flex-col gap-4 p-5 sm:p-6", className)}
      data-motion
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 id="getting-started-title" className="text-base font-medium text-ink">
          {t("gettingStarted")}
        </h2>
        <div className="flex flex-1 items-center justify-end gap-4">
          <Meter
            value={done / tasks.length}
            label={t("progress", { done: formatNumber(done, locale), total: formatNumber(tasks.length, locale) })}
            showValue
            className="w-full max-w-[220px]"
          />
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            {t("dismiss")}
          </Button>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong sm:grid-cols-2 lg:grid-cols-4">
        {tasks.map(({ key, done: isDone, icon: Icon, href }) => {
          const content = (
            <>
              <span
                className={clsx(
                  "flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors",
                  isDone ? "bg-ink text-paper" : "border border-rule-strong",
                )}
                aria-hidden
              >
                {isDone && <Check size={12} strokeWidth={3} />}
              </span>
              <span className={clsx("flex-1 text-sm", isDone ? "text-ink-3 line-through" : "text-ink")}>
                {t(`tasks.${key}`)}
              </span>
              <Icon size={15} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            </>
          );
          const rowClass = "flex w-full items-center gap-3 bg-sheet px-4 py-3 text-left transition-colors hover:bg-muted";
          return (
            <li key={key} className="flex">
              {isDone ? (
                <span className={rowClass}>
                  {content}
                  <span className="sr-only">{t("done")}</span>
                </span>
              ) : href ? (
                <Link href={href} className={rowClass} style={{ outlineOffset: -2 }}>
                  {content}
                </Link>
              ) : (
                <button type="button" onClick={() => applyTheme("dark")} className={rowClass} style={{ outlineOffset: -2 }}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

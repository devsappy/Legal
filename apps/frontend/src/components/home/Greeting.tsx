"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages, Scale } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { useNow } from "@/hooks/useNow";
import { firstName, formatLongDate, localIsoDate, timeOfDay } from "@/lib/greeting";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { Badge } from "@/components/ui/Badge";

type Props = {
  name: string;
  /** The server's clock, used for the first paint; the visitor's clock takes over after hydration. */
  serverNow: number;
};

/**
 * The dashboard's header tile: the time-of-day greeting, today's date and
 * the two choices every answer depends on (the Act and the language), each
 * with a link into Settings. Client-side because the greeting follows the
 * visitor's clock and the Act comes from the device store.
 */
export function Greeting({ name, serverNow }: Props) {
  const t = useTranslations("home");
  const locale = useLocale();
  const { jurisdiction } = useJurisdiction();

  // Server and hydration render from the server's clock so the markup
  // matches; afterwards the visitor's own time of day wins.
  const now = useNow(serverNow);
  const tod = timeOfDay(new Date(now));
  const act = JURISDICTIONS.find((j) => j.id === jurisdiction) ?? JURISDICTIONS[0];
  const language = LANGUAGES.find((l) => l.code === locale);

  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div>
        <p className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          <span className="sr-only">{t("today")}: </span>
          <time dateTime={localIsoDate(now)}>{formatLongDate(now, locale)}</time>
        </p>
        <h1 className="mt-2 text-balance text-2xl font-medium text-ink sm:text-3xl">
          {t(`greeting.${tod}`, { name: firstName(name) || name })}
        </h1>
      </div>

      <dl className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-2">
          <dt className="flex items-center gap-1.5 text-xs text-ink-3">
            <Scale size={14} strokeWidth={1.75} aria-hidden />
            {t("currentAct")}
          </dt>
          <dd className="flex items-center gap-2">
            <Badge kind="solid" mono>
              {act.short}
            </Badge>
            <Link
              href="/settings/preferences"
              aria-label={t("changeAct")}
              className="rounded-sm text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline"
            >
              {t("change")}
            </Link>
          </dd>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <dt className="flex items-center gap-1.5 text-xs text-ink-3">
            <Languages size={14} strokeWidth={1.75} aria-hidden />
            {t("currentLanguage")}
          </dt>
          <dd className="flex items-center gap-2">
            <Badge kind="neutral">
              <span lang={locale}>{language?.native ?? locale}</span>
            </Badge>
            <Link
              href="/settings/preferences"
              aria-label={t("changeLanguage")}
              className="rounded-sm text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline"
            >
              {t("change")}
            </Link>
          </dd>
        </div>
      </dl>
    </div>
  );
}

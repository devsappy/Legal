"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import clsx from "clsx";
import { Link, useRouter } from "@/i18n/navigation";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { useHistory } from "@/lib/history";
import { setOnboarded, useOnboarding } from "@/lib/onboarding";
import { askHref } from "@/lib/routes";
import { usePersisted, writePersisted } from "@/hooks/usePersisted";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { JurisdictionSelect } from "@/components/layout/JurisdictionSelect";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { firstName } from "@/lib/greeting";
import { formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Meter } from "@/components/ui/Meter";

/**
 * Where the checklist started from, so "changed" survives the locale
 * navigation a language switch causes (the page remounts in the new
 * locale) and "kept" survives a reload.
 */
type WelcomeState = {
  startLocale: string | null;
  startAct: string | null;
  keptLocale: boolean;
  keptAct: boolean;
};

const KEY = "coop.welcome";
const EMPTY: WelcomeState = { startLocale: null, startAct: null, keptLocale: false, keptAct: false };
const TOTAL = 3;

type Props = {
  name: string;
  /** Grid placement and entrance classes from the page; the tile chrome is added here so nothing renders while hidden. */
  className?: string;
};

export function WelcomeCard({ name, className }: Props) {
  // useSearchParams needs a boundary; the tree is dynamic, so the fallback never shows.
  return (
    <Suspense fallback={null}>
      <WelcomeCardInner name={name} className={className} />
    </Suspense>
  );
}

/**
 * First-run checklist: the Act, the language and a first question. Shown
 * right after registration (?welcome=1) or whenever a device has neither
 * onboarded nor asked anything. Nothing renders before hydration, so the
 * server never guesses at device state.
 */
function WelcomeCardInner({ name, className }: Props) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const fromParam = params.get("welcome") === "1";

  const { onboarded, plan, hydrated } = useOnboarding();
  const history = useHistory();
  const { jurisdiction } = useJurisdiction();
  const [welcome, setWelcome] = usePersisted<WelcomeState>(KEY, EMPTY);
  const [skipped, setSkipped] = useState(false);

  const fresh = !onboarded && history.length === 0;
  const visible = hydrated && !skipped && (fromParam || fresh);

  // Remember the starting point the first time the card is shown.
  useEffect(() => {
    if (!visible || welcome.startLocale !== null) return;
    setWelcome({ ...welcome, startLocale: locale, startAct: jurisdiction });
  }, [visible, welcome, locale, jurisdiction, setWelcome]);

  const actDone = welcome.keptAct || (welcome.startAct !== null && jurisdiction !== welcome.startAct);
  const languageDone = welcome.keptLocale || (welcome.startLocale !== null && locale !== welcome.startLocale);
  const askDone = history.length > 0;

  // A first question closes the loop: the card will not come back on the next visit.
  useEffect(() => {
    if (askDone && !onboarded) setOnboarded(true);
  }, [askDone, onboarded]);

  if (!visible) return null;

  const done = [actDone, languageDone, askDone].filter(Boolean).length;
  const act = JURISDICTIONS.find((j) => j.id === jurisdiction) ?? JURISDICTIONS[0];
  const language = LANGUAGES.find((l) => l.code === locale);
  const planLabel = plan ? (t.has(`plans.${plan}`) ? t(`plans.${plan}`) : plan) : null;

  const skip = () => {
    setSkipped(true);
    setOnboarded(true);
    writePersisted(KEY, undefined);
    if (fromParam) router.replace("/home");
  };

  return (
    <section aria-labelledby="welcome-title" className={clsx("tile flex min-w-0 flex-col gap-5 p-5 sm:p-6", className)} data-motion>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="welcome-title" className="text-xl font-medium text-ink">
            {t("welcome", { name: firstName(name) || name })}
          </h2>
          <p className="mt-1 max-w-[60ch] text-sm text-ink-2">{t("welcomeBody")}</p>
        </div>
        {planLabel && <Badge kind="soft">{t("planBadge", { plan: planLabel })}</Badge>}
      </div>

      <ol className="divide-y divide-rule border-y border-rule">
        <Step index={1} done={actDone} title={t("steps.act")} body={t("steps.actBody")} doneLabel={t("done")}>
          <JurisdictionSelect size="md" />
          {!actDone && (
            <Button variant="ghost" size="sm" onClick={() => setWelcome({ ...welcome, keptAct: true })}>
              {t("keep", { value: act.short })}
            </Button>
          )}
        </Step>
        <Step index={2} done={languageDone} title={t("steps.language")} body={t("steps.languageBody")} doneLabel={t("done")}>
          <LanguageSwitcher size="md" />
          {!languageDone && (
            <Button variant="ghost" size="sm" onClick={() => setWelcome({ ...welcome, keptLocale: true })}>
              {t("keep", { value: language?.native ?? locale })}
            </Button>
          )}
        </Step>
        <Step index={3} done={askDone} title={t("steps.ask")} body={t("steps.askBody")} doneLabel={t("done")}>
          {!askDone && (
            <Link href={askHref()} className={buttonClasses("primary", "sm")}>
              {t("askNow")}
            </Link>
          )}
        </Step>
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Meter value={done / TOTAL} label={t("progress", { done: formatNumber(done, locale), total: formatNumber(TOTAL, locale) })} showValue className="w-full max-w-xs" />
        <Button variant="ghost" size="sm" onClick={skip}>
          {t("skip")}
        </Button>
      </div>
    </section>
  );
}

function Step({
  index,
  done,
  title,
  body,
  doneLabel,
  children,
}: {
  index: number;
  done: boolean;
  title: string;
  body: string;
  doneLabel: string;
  children?: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={clsx(
            "cell-badge mt-px flex size-6 shrink-0 items-center justify-center rounded-sm font-mono text-xs font-semibold transition-colors",
            done ? "bg-ink text-paper" : "border border-rule-strong text-ink-2",
          )}
          aria-hidden
        >
          {done ? <Check size={14} strokeWidth={2.5} /> : index}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
            {title}
            {done && (
              <Badge kind="soft" className="font-normal">
                {doneLabel}
              </Badge>
            )}
          </p>
          <p className="mt-0.5 text-xs text-ink-3">{body}</p>
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 pl-9 sm:pl-0">{children}</div>}
    </li>
  );
}

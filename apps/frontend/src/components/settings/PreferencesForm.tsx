"use client";

import { useId, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Moon, Sun } from "lucide-react";
import clsx from "clsx";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { setPref, usePrefs, type Prefs } from "@/lib/prefs";
import { toast } from "@/lib/toast";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { applyTheme, useTheme, type ThemeMode } from "@/components/layout/ThemeToggle";
import { Switch } from "@/components/ui/Switch";
import { SettingsSection } from "./SettingsSection";

/*
 * Rows are real radio inputs (visually hidden) inside labels: the group
 * gets arrow-key navigation and form semantics from the platform, and the
 * row draws its own selected and focus states with :has().
 */
const LIST = "divide-y divide-rule overflow-hidden rounded-lg border border-rule";
const ROW =
  "flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-muted/60 " +
  "has-checked:bg-muted has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-ink";

function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={clsx(
        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
        checked ? "border-ink bg-ink text-paper" : "border-rule-strong bg-sheet",
      )}
      aria-hidden
    >
      {checked && <Check size={10} strokeWidth={3} />}
    </span>
  );
}

function RadioRow({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className={ROW}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <RadioMark checked={checked} />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

/**
 * Settings › Preferences. Language navigates to the same page in the
 * chosen locale; the Act writes the jurisdiction store the TopBar reads;
 * appearance goes through applyTheme; the rest are per-device prefs.
 */
export function PreferencesForm() {
  const t = useTranslations("settings.prefs");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { jurisdiction, setJurisdiction } = useJurisdiction();
  const { mode } = useTheme();
  const prefs = usePrefs();
  const ids = useId();

  const languageName = `${ids}-language`;
  const actName = `${ids}-act`;
  const themeName = `${ids}-theme`;

  const chooseAct = (id: string) => {
    if (id === jurisdiction) return;
    setJurisdiction(id);
    const j = JURISDICTIONS.find((x) => x.id === id);
    if (j) toast.success(t("jurisdictionSet", { act: j.short }));
  };

  const toggles: { key: keyof Prefs; label: string; hint: string }[] = [
    { key: "enterSends", label: t("enterSends"), hint: t("enterSendsHint") },
    { key: "showTrace", label: t("showTrace"), hint: t("showTraceHint") },
    { key: "autoRead", label: t("autoRead"), hint: t("autoReadHint") },
  ];

  const themes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("light"), icon: Sun },
    { value: "dark", label: t("dark"), icon: Moon },
  ];

  return (
    <>
      <SettingsSection title={t("language")} description={t("languageHint")}>
        <fieldset>
          <legend className="sr-only">{t("language")}</legend>
          <div className={LIST}>
            {LANGUAGES.map((l) => (
              <RadioRow
                key={l.code}
                name={languageName}
                value={l.code}
                checked={l.code === locale}
                onChange={() => router.replace(pathname, { locale: l.code as Locale })}
              >
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span lang={l.code} className="text-sm font-medium text-ink">
                    {l.native}
                  </span>
                  {l.label !== l.native && <span className="text-xs text-ink-3">{l.label}</span>}
                </span>
              </RadioRow>
            ))}
          </div>
        </fieldset>
      </SettingsSection>

      <SettingsSection title={t("jurisdiction")} description={t("jurisdictionHint")}>
        <fieldset>
          <legend className="sr-only">{t("jurisdiction")}</legend>
          <div className={LIST}>
            {JURISDICTIONS.map((j) => (
              <RadioRow
                key={j.id}
                name={actName}
                value={j.id}
                checked={j.id === jurisdiction}
                onChange={() => chooseAct(j.id)}
              >
                <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                  <span className="w-[8.5rem] shrink-0 font-mono text-xs text-ink-2">{j.short}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{j.act}</span>
                    <span className="mt-0.5 block text-xs text-ink-3">{t(`jurisdictionHints.${j.id}`)}</span>
                  </span>
                </span>
              </RadioRow>
            ))}
          </div>
        </fieldset>
      </SettingsSection>

      <SettingsSection title={t("appearance")} description={t("appearanceHint")}>
        <fieldset className="inline-flex rounded-md border border-rule bg-sheet p-0.5">
          <legend className="sr-only">{t("appearance")}</legend>
          {themes.map(({ value, label, icon: Icon }) => {
            const active = mode === value;
            return (
              <label
                key={value}
                className={clsx(
                  "flex h-8 cursor-pointer items-center gap-1.5 rounded-[5px] px-3 text-sm font-medium transition-colors",
                  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
                  active ? "bg-ink text-paper" : "text-ink-2 hover:bg-muted hover:text-ink",
                )}
              >
                <input
                  type="radio"
                  name={themeName}
                  value={value}
                  checked={active}
                  onChange={() => applyTheme(value)}
                  className="sr-only"
                />
                <Icon size={14} strokeWidth={2} aria-hidden />
                {label}
              </label>
            );
          })}
        </fieldset>
      </SettingsSection>

      <SettingsSection title={t("composer")} description={t("composerHint")}>
        <div className="divide-y divide-rule">
          {toggles.map((row) => (
            <Switch
              key={row.key}
              label={row.label}
              description={row.hint}
              checked={prefs[row.key]}
              onCheckedChange={(v) => setPref(row.key, v)}
              className="py-3 first:pt-0 last:pb-0"
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title={t("motion")}>
        <Switch
          label={t("reduceMotion")}
          description={t("reduceMotionHint")}
          checked={prefs.reduceMotion}
          onCheckedChange={(v) => setPref("reduceMotion", v)}
        />
      </SettingsSection>
    </>
  );
}

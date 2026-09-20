"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Languages, Scale } from "lucide-react";
import clsx from "clsx";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { DropdownMenu, MenuLabel, MenuRadioGroup, MenuRadioItem } from "@/components/ui/DropdownMenu";

const CHIP =
  "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-rule bg-sheet pl-2 pr-1.5 text-xs font-medium text-ink transition-colors " +
  "hover:border-rule-strong hover:bg-muted aria-expanded:border-rule-strong aria-expanded:bg-muted";

type Props = {
  disabled?: boolean;
  className?: string;
};

/**
 * The two facts every answer depends on, sitting on the composer where the
 * question is typed: which Act to answer from and which language to use.
 * Both open radio menus with the full names; the language switch changes
 * the route's locale in place.
 */
export function ContextChips({ disabled, className }: Props) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { jurisdiction, setJurisdiction } = useJurisdiction();

  const act = JURISDICTIONS.find((j) => j.id === jurisdiction) ?? JURISDICTIONS[0];
  const language = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  return (
    <div className={clsx("flex flex-wrap items-center gap-1.5", className)}>
      <DropdownMenu
        label={t("jurisdictionMenu")}
        align="start"
        side="top"
        className="min-w-[260px]"
        trigger={
          <button type="button" className={CHIP} disabled={disabled} aria-label={`${t("jurisdictionChip")}: ${act.short}`}>
            <Scale size={13} strokeWidth={2} aria-hidden />
            <span className="truncate">{act.short}</span>
            <ChevronDown size={12} className="shrink-0 text-ink-3" aria-hidden />
          </button>
        }
      >
        <MenuLabel>{t("jurisdictionMenu")}</MenuLabel>
        <MenuRadioGroup value={jurisdiction} onValueChange={setJurisdiction}>
          {JURISDICTIONS.map((j) => (
            <MenuRadioItem key={j.id} value={j.id}>
              <span className="flex min-w-0 flex-col py-0.5">
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-ink">{j.short}</span>
                  <span className="truncate text-xs text-ink-3">{j.name}</span>
                </span>
                <span className="truncate text-2xs text-ink-2">{j.act}</span>
              </span>
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </DropdownMenu>

      <DropdownMenu
        label={t("languageMenu")}
        align="start"
        side="top"
        trigger={
          <button type="button" className={CHIP} disabled={disabled} aria-label={`${t("languageChip")}: ${language.native}`}>
            <Languages size={13} strokeWidth={2} aria-hidden />
            <span className="truncate">{language.native}</span>
            <ChevronDown size={12} className="shrink-0 text-ink-3" aria-hidden />
          </button>
        }
      >
        <MenuLabel>{t("languageMenu")}</MenuLabel>
        <MenuRadioGroup
          value={locale}
          onValueChange={(next) => {
            if (next !== locale) router.replace(pathname, { locale: next as Locale });
          }}
        >
          {LANGUAGES.map((l) => (
            <MenuRadioItem key={l.code} value={l.code}>
              <span className="flex items-baseline gap-2">
                <span>{l.native}</span>
                {l.native !== l.label && <span className="text-xs text-ink-3">{l.label}</span>}
              </span>
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </DropdownMenu>
    </div>
  );
}

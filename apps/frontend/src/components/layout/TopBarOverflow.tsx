"use client";

import { useLocale, useTranslations } from "next-intl";
import { Download, Ellipsis, Moon, Scale, Sun } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { useCommandApi } from "@/components/command/CommandProvider";
import { IconButton } from "@/components/ui/IconButton";
import { DropdownMenu, MenuItem, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuSeparator } from "@/components/ui/DropdownMenu";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { useJurisdiction } from "./JurisdictionProvider";
import { applyTheme, useTheme, type ThemeMode } from "./ThemeToggle";

/**
 * Below `sm` the top bar has no room for the theme toggle, the language
 * pill and the export button, so they fold into this "⋯" menu. The same
 * actions, so nothing is lost on a 360px screen.
 */
export function TopBarOverflow({
  showExport,
  showJurisdiction,
  className,
}: {
  showExport: boolean;
  /** The Act picker is hidden from the bar on phones; it moves in here. */
  showJurisdiction: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { mode } = useTheme();
  const { canExport, exportCurrent } = useCommandApi();
  const { jurisdiction, setJurisdiction } = useJurisdiction();

  return (
    <DropdownMenu
      align="end"
      label={t("shell.more")}
      trigger={
        <IconButton label={t("shell.more")} tooltip={false} size="sm" className={className}>
          <Ellipsis size={16} />
        </IconButton>
      }
    >
      {showExport && (
        <>
          <MenuItem icon={<Download size={14} />} onSelect={exportCurrent} disabled={!canExport}>
            {t("shell.export")}
          </MenuItem>
          <MenuSeparator />
        </>
      )}
      {showJurisdiction && (
        <>
          <MenuLabel>{t("nav.jurisdiction")}</MenuLabel>
          <MenuRadioGroup value={jurisdiction} onValueChange={setJurisdiction}>
            {JURISDICTIONS.map((j) => (
              <MenuRadioItem key={j.id} value={j.id} icon={<Scale size={14} />}>
                <span className="font-mono text-xs">{j.short}</span>
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
          <MenuSeparator />
        </>
      )}
      <MenuLabel>{t("user.theme")}</MenuLabel>
      <MenuRadioGroup value={mode} onValueChange={(v) => applyTheme(v as ThemeMode)}>
        <MenuRadioItem value="light" icon={<Sun size={14} />}>
          {t("ui.theme.light")}
        </MenuRadioItem>
        <MenuRadioItem value="dark" icon={<Moon size={14} />}>
          {t("ui.theme.dark")}
        </MenuRadioItem>
      </MenuRadioGroup>
      <MenuLabel>{t("nav.language")}</MenuLabel>
      <MenuRadioGroup value={locale} onValueChange={(next) => router.replace(pathname, { locale: next as Locale })}>
        {LANGUAGES.map((l) => (
          <MenuRadioItem key={l.code} value={l.code}>
            <span lang={l.code}>{l.native}</span>
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
    </DropdownMenu>
  );
}

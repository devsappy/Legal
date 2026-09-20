"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { ChevronsUpDown, FileText, House, Keyboard, LifeBuoy, LogOut, Moon, Settings2, ShieldCheck, Sparkles, Sun } from "lucide-react";
import type { SessionUser } from "@sahayak/shared";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { useChatContext } from "@/components/chat/ChatProvider";
import { useCommandApi } from "@/components/command/CommandProvider";
import { useHelp } from "@/components/help/HelpProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import {
  DropdownMenu,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Switch } from "@/components/ui/Switch";
import { Tooltip } from "@/components/ui/Tooltip";
import { LANGUAGES, SESSION_STORAGE_KEY } from "@/lib/config";
import { clearHistory } from "@/lib/history";
import { clearPins } from "@/lib/pins";
import { clearProgress } from "@/lib/progress";
import { toast } from "@/lib/toast";
import { applyTheme, useTheme, type ThemeMode } from "./ThemeToggle";
import { SyncStatus } from "./SyncStatus";

type Props = {
  user: SessionUser;
  /**
   * `full` is the sidebar footer (avatar, name, email); `avatar` is the rail
   * and the phone top bar; `static` is the same footer without a menu, for
   * the modal drawer (a portalled menu there would be inert) — sign out is
   * a button and everything else is reachable from the top bar.
   */
  variant?: "full" | "avatar" | "static";
  align?: "start" | "end";
  side?: "top" | "bottom";
  className?: string;
};

/**
 * Account menu: who is signed in, the places only a person needs (Home,
 * Settings), theme and language, help entries and sign out. Language and
 * theme are radio groups so the current choice is visible before it is
 * changed. Sign out goes through SignOutDialog so the user can choose
 * whether this device forgets their history.
 */
export function UserMenu({ user, variant = "full", align = "start", side = "top", className }: Props) {
  const t = useTranslations("user");
  const nav = useTranslations("nav");
  const shell = useTranslations("shell");
  const ui = useTranslations("ui");
  const sc = useTranslations("shortcuts");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { mode } = useTheme();
  const { openShortcuts, requestSignOut } = useCommandApi();
  const { openHelp, openWhatsNew, unread } = useHelp();
  const role = t(`role.${user.role}`);

  if (variant === "static") {
    return (
      <div className={clsx("flex items-center gap-2.5 rounded-xl border border-rule bg-sheet p-2", className)}>
        <Avatar name={user.name} size="lg" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-ink">{user.name}</span>
            <SyncStatus variant="dot" />
            <Badge kind={user.role === "admin" ? "solid" : "soft"}>{role}</Badge>
          </span>
          <span className="block truncate text-2xs text-ink-3">{user.email}</span>
        </span>
        <IconButton label={t("signOut")} tooltip={false} size="sm" onClick={requestSignOut} className="text-ink-3">
          <LogOut size={15} />
        </IconButton>
      </div>
    );
  }

  const trigger =
    variant === "avatar" ? (
      <button
        type="button"
        aria-label={`${t("menu")}: ${user.name}`}
        className={clsx(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted",
          className,
        )}
      >
        <Avatar name={user.name} size="md" />
        {unread && <span aria-hidden className="absolute right-0.5 top-0.5 size-2 rounded-full bg-ink ring-2 ring-sheet" />}
      </button>
    ) : (
      <button
        type="button"
        aria-label={`${t("menu")}: ${user.name}`}
        className={clsx(
          "flex w-full items-center gap-2.5 rounded-xl border border-rule bg-sheet p-2 pr-2 text-left transition-colors hover:border-rule-strong hover:bg-muted",
          className,
        )}
      >
        <Avatar name={user.name} size="lg" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-ink">{user.name}</span>
            <SyncStatus variant="dot" />
          </span>
          <span className="block truncate text-2xs text-ink-3">{user.email}</span>
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-ink-3" aria-hidden />
      </button>
    );

  return (
    <DropdownMenu trigger={trigger} align={align} side={side} className="w-[260px]">
      <div role="presentation" className="px-2 pb-2 pt-1.5">
        <div className="flex items-center gap-2.5">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <Tooltip content={user.email} side="bottom">
              <p className="truncate text-2xs text-ink-3">{user.email}</p>
            </Tooltip>
          </div>
          <Badge kind={user.role === "admin" ? "solid" : "soft"}>{role}</Badge>
        </div>
      </div>
      <MenuSeparator />
      <MenuItem icon={<House size={14} />} href="/home">
        {nav("home")}
      </MenuItem>
      <MenuItem icon={<Settings2 size={14} />} href="/settings" shortcut="mod+,">
        {nav("settings")}
      </MenuItem>
      <MenuSeparator />
      <MenuLabel>{t("theme")}</MenuLabel>
      <MenuRadioGroup value={mode} onValueChange={(v) => applyTheme(v as ThemeMode)}>
        <MenuRadioItem value="light" icon={<Sun size={14} />}>
          {ui("theme.light")}
        </MenuRadioItem>
        <MenuRadioItem value="dark" icon={<Moon size={14} />}>
          {ui("theme.dark")}
        </MenuRadioItem>
      </MenuRadioGroup>
      <MenuLabel>{t("language")}</MenuLabel>
      <MenuRadioGroup value={locale} onValueChange={(next) => router.replace(pathname, { locale: next as Locale })}>
        {LANGUAGES.map((l) => (
          <MenuRadioItem key={l.code} value={l.code}>
            <span lang={l.code}>{l.native}</span>
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
      <MenuSeparator />
      <MenuItem icon={<Keyboard size={14} />} shortcut="shift+/" onSelect={openShortcuts}>
        {sc("title")}
      </MenuItem>
      <MenuItem icon={<LifeBuoy size={14} />} onSelect={() => openHelp()}>
        {shell("help")}
      </MenuItem>
      <MenuItem icon={<Sparkles size={14} />} onSelect={openWhatsNew}>
        <span className="inline-flex items-center gap-1.5">
          {shell("whatsNew")}
          {unread && <span aria-hidden className="size-1.5 rounded-full bg-ink" />}
        </span>
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={<ShieldCheck size={14} />} href="/privacy">
        {t("privacy")}
      </MenuItem>
      <MenuItem icon={<FileText size={14} />} href="/terms">
        {t("terms")}
      </MenuItem>
      {user.role !== "admin" && <p className="px-2 pb-1.5 pt-0.5 text-2xs text-ink-3">{t("adminHint")}</p>}
      <MenuSeparator />
      <MenuItem icon={<LogOut size={14} />} destructive onSelect={requestSignOut}>
        {t("signOut")}
      </MenuItem>
    </DropdownMenu>
  );
}

/**
 * Sign-out confirmation with the "also clear this device" switch (off by
 * default). Signing out never touches local history unless the switch is
 * on; then conversations, pins, procedure progress, the tab's session and
 * composer drafts are removed from this browser.
 */
export function SignOutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("user");
  const ui = useTranslations("ui");
  const router = useRouter();
  const chat = useChatContext();
  const [clear, setClear] = useState(false);
  const [busy, setBusy] = useState(false);

  // Each opening starts with the switch off.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setClear(false);
    setBusy(false);
  }

  const signOut = async () => {
    setBusy(true);
    const res = await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    if (!res || !res.ok) {
      setBusy(false);
      toast.error(t("signOutFailed"));
      return;
    }
    chat.reset();
    if (clear) clearDevice();
    onOpenChange(false);
    toast.success(t("signedOut"));
    router.replace("/login");
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("signOutTitle")}
      description={t("signOutBody")}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy} data-autofocus>
            {ui("cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={signOut} loading={busy}>
            {t("signOut")}
          </Button>
        </>
      }
    >
      <Switch checked={clear} onCheckedChange={setClear} label={t("clearDevice")} description={t("clearDeviceHint")} />
    </Dialog>
  );
}

/** Removes everything this device remembers about the account; server data is untouched. */
function clearDevice() {
  clearHistory();
  clearPins();
  clearProgress();
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    for (const store of [localStorage, sessionStorage]) {
      const gone: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        // Unsent drafts plus the home page's per-account welcome bookkeeping.
        if (key && (key.startsWith("coop.draft.") || key === "coop.welcome" || key === "coop.gettingStarted.dismissed")) gone.push(key);
      }
      for (const key of gone) store.removeItem(key);
    }
  } catch {
    /* storage unavailable */
  }
}

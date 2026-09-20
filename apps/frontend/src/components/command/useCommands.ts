"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Download,
  Keyboard,
  Languages,
  LifeBuoy,
  ListChecks,
  LogOut,
  MessageSquareText,
  Moon,
  Plus,
  Scale,
  Settings2,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { pick, type SessionUser } from "@sahayak/shared";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { useChatContext } from "@/components/chat/ChatProvider";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { applyTheme, useTheme } from "@/components/layout/ThemeToggle";
import { useHelp } from "@/components/help/HelpProvider";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { useHistory } from "@/lib/history";
import type { Combo } from "@/lib/keys";
import { useProcedures } from "@/lib/procedures-client";
import { routesFor } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useCommandApi } from "./CommandProvider";

export type CommandGroup = "actions" | "goto" | "conversations" | "procedures" | "language" | "jurisdiction";

export const GROUP_ORDER: CommandGroup[] = ["actions", "goto", "conversations", "procedures", "language", "jurisdiction"];

export type Command = {
  id: string;
  group: CommandGroup;
  label: string;
  /** Secondary line: the full Act name, a language's English name. */
  hint?: string;
  icon?: LucideIcon;
  shortcut?: Combo;
  /** Extra words the search may match (English names of languages, act codes). */
  keywords?: string;
  run: () => void;
};

const CHORDS: Record<string, Combo> = { home: "g h", ask: "g a", checklists: "g p", settings: "g s", admin: "g d" };

/**
 * Everything the palette can do, rebuilt when its sources change: static
 * actions, the route map filtered by role, stored conversations, the
 * cached procedure list, interface languages and Acts. Labels arrive
 * translated so the palette only searches and renders.
 */
export function useCommands(user: SessionUser): Command[] {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const chat = useChatContext();
  const api = useCommandApi();
  const help = useHelp();
  const { mode } = useTheme();
  const { jurisdiction, setJurisdiction } = useJurisdiction();
  const history = useHistory();
  const { procedures } = useProcedures();

  const { canExport, newConversation, exportCurrent, openShortcuts, requestSignOut } = api;
  const { openHelp, openWhatsNew } = help;
  // Stable callback from useChat; depending on it (not the whole chat object)
  // keeps the list from being rebuilt on every streamed token.
  const { open: openConversation } = chat;

  return useMemo<Command[]>(() => {
    const list: Command[] = [];

    /* ---- actions ---- */
    list.push({ id: "action:new", group: "actions", label: t("command.actions.newConversation"), icon: Plus, shortcut: "mod+shift+o", run: newConversation });
    list.push({
      id: "action:theme",
      group: "actions",
      label: t("command.actions.toggleTheme"),
      hint: t(mode === "dark" ? "ui.theme.light" : "ui.theme.dark"),
      icon: mode === "dark" ? Sun : Moon,
      run: () => applyTheme(mode === "dark" ? "light" : "dark"),
    });
    if (canExport) {
      list.push({ id: "action:export", group: "actions", label: t("command.actions.export"), icon: Download, shortcut: "mod+shift+e", run: exportCurrent });
    }
    list.push({ id: "action:shortcuts", group: "actions", label: t("command.actions.shortcuts"), icon: Keyboard, shortcut: "shift+/", run: openShortcuts });
    list.push({ id: "action:help", group: "actions", label: t("command.actions.help"), icon: LifeBuoy, run: () => openHelp() });
    list.push({ id: "action:whatsnew", group: "actions", label: t("command.actions.whatsNew"), icon: Sparkles, run: openWhatsNew });
    list.push({ id: "action:settings", group: "actions", label: t("command.actions.settings"), icon: Settings2, shortcut: "mod+,", run: () => router.push("/settings") });
    list.push({ id: "action:signout", group: "actions", label: t("command.actions.signOut"), icon: LogOut, run: requestSignOut });

    /* ---- go to ---- */
    for (const route of routesFor(user.role)) {
      list.push({
        id: `goto:${route.key}`,
        group: "goto",
        label: t(`nav.${route.navKey}`),
        icon: route.icon,
        shortcut: CHORDS[route.key],
        keywords: route.href,
        run: () => router.push(route.href),
      });
    }

    /* ---- conversations ---- */
    for (const c of history) {
      list.push({
        id: `conv:${c.id}`,
        group: "conversations",
        label: c.title,
        icon: MessageSquareText,
        run: () => {
          openConversation(c.id);
          if (pathname !== "/ask") router.push("/ask");
        },
      });
    }

    /* ---- procedures ---- */
    for (const p of procedures) {
      const act = JURISDICTIONS.find((j) => j.id === p.jurisdiction);
      list.push({
        id: `proc:${p.slug}`,
        group: "procedures",
        label: pick(p.title, locale),
        hint: act?.short,
        icon: ListChecks,
        keywords: [p.slug, pick(p.summary, locale), act?.act ?? ""].join(" "),
        run: () => router.push(`/checklists/${p.slug}`),
      });
    }

    /* ---- language ---- */
    for (const l of LANGUAGES) {
      if (l.code === locale) continue;
      list.push({
        id: `lang:${l.code}`,
        group: "language",
        label: l.native,
        hint: `${l.label} · ${t("command.switchLanguage")}`,
        icon: Languages,
        keywords: `${l.label} ${l.code} language`,
        run: () => router.replace(pathname, { locale: l.code as Locale }),
      });
    }

    /* ---- jurisdiction ---- */
    for (const j of JURISDICTIONS) {
      if (j.id === jurisdiction) continue;
      list.push({
        id: `juris:${j.id}`,
        group: "jurisdiction",
        label: j.short,
        hint: j.act,
        icon: Scale,
        keywords: `${j.name} ${j.id} ${t("command.answerFrom")}`,
        run: () => {
          setJurisdiction(j.id);
          toast.success(t("command.jurisdictionSet", { act: j.short }));
        },
      });
    }

    return list;
  }, [
    t,
    locale,
    router,
    pathname,
    openConversation,
    mode,
    jurisdiction,
    setJurisdiction,
    history,
    procedures,
    user.role,
    canExport,
    newConversation,
    exportCurrent,
    openShortcuts,
    requestSignOut,
    openHelp,
    openWhatsNew,
  ]);
}

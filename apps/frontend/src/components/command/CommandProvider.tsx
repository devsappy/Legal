"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { SessionUser } from "@sahayak/shared";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useChatContext } from "@/components/chat/ChatProvider";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { SignOutDialog } from "@/components/layout/UserMenu";
import { useHotkey } from "@/hooks/useHotkey";
import { readPersisted, writePersisted } from "@/hooks/usePersisted";
import { JURISDICTIONS } from "@/lib/config";
import { conversationToMarkdown, downloadText, exportFilename } from "@/lib/export";
import { getConversation, type Conversation } from "@/lib/history";
import { toast } from "@/lib/toast";
import { ShortcutsSheet } from "./ShortcutsSheet";

export type SidebarMode = "expanded" | "rail";
export const SIDEBAR_KEY = "coop.sidebar";

/** Flips the persisted sidebar mode; AppShell reads it through usePersisted. */
export function toggleSidebarMode(): SidebarMode {
  const next: SidebarMode = readPersisted<SidebarMode>(SIDEBAR_KEY, "expanded") === "rail" ? "expanded" : "rail";
  writePersisted(SIDEBAR_KEY, next);
  return next;
}

type CommandApi = {
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  openShortcuts: () => void;
  toggleSidebar: () => void;
  newConversation: () => void;
  /** Whether the open conversation has anything to export. */
  canExport: boolean;
  exportCurrent: () => void;
  exportConversation: (c: Conversation) => void;
  requestSignOut: () => void;
};

const Ctx = createContext<CommandApi | null>(null);

/**
 * The shell's global actions and keyboard shortcuts in one place. The
 * command palette, the top bar, the sidebar, the user menu and the row
 * menus all call the same functions, so "export" or "new conversation"
 * behaves identically wherever it is triggered. Hotkeys are registered
 * through useHotkey so the shortcuts sheet lists them.
 */
export function CommandProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const chat = useChatContext();
  const { jurisdiction } = useJurisdiction();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const toggleSidebar = useCallback(() => {
    toggleSidebarMode();
  }, []);
  const requestSignOut = useCallback(() => setSignOutOpen(true), []);

  // Callbacks read the transcript through a ref so the context value (and
  // every consumer) does not churn on each streamed token.
  const chatRef = useRef(chat);
  useEffect(() => {
    chatRef.current = chat;
  });

  const { reset } = chat;
  const newConversation = useCallback(() => {
    reset();
    if (pathname !== "/ask") router.push("/ask");
  }, [reset, pathname, router]);

  const act = JURISDICTIONS.find((j) => j.id === jurisdiction)?.act ?? jurisdiction;
  const exportConversation = useCallback(
    (c: Conversation) => {
      if (!c.messages.some((m) => m.role === "user")) {
        toast.info(t("shell.nothingToExport"));
        return;
      }
      const md = conversationToMarkdown(c, {
        you: t("chat.you"),
        assistant: t("chat.assistant"),
        sources: t("chat.sources"),
        verified: t("chat.verified"),
        unverified: t("chat.unverified"),
        title: t("app.name"),
        answeringFrom: t("chat.answeringFrom"),
        act,
        notice: t("app.notice"),
      });
      downloadText(exportFilename(c.title), md);
      toast.success(t("shell.exported"));
    },
    [t, act],
  );

  const canExport = chat.messages.some((m) => m.role === "user");
  const exportCurrent = useCallback(() => {
    const { messages, sessionId } = chatRef.current;
    const firstUser = messages.find((m) => m.role === "user");
    const stored = sessionId ? getConversation(sessionId) : undefined;
    exportConversation({
      id: sessionId || "draft",
      title: stored?.title ?? firstUser?.text.replace(/\s+/g, " ").slice(0, 96) ?? "",
      updatedAt: Date.now(),
      messages,
    });
  }, [exportConversation]);

  /* ---- global shortcuts (listed in the sheet under "Everywhere") ---- */
  const s = useTranslations("shortcuts");
  const G = "global" as const;
  useHotkey("mod+k", () => setPaletteOpen((o) => !o), { id: "palette", scope: G, label: s("palette"), allowInInputs: true });
  useHotkey("mod+shift+o", newConversation, { id: "new-conversation", scope: G, label: s("newConversation"), allowInInputs: true });
  useHotkey("mod+b", toggleSidebar, { id: "toggle-sidebar", scope: G, label: s("toggleSidebar"), allowInInputs: true });
  useHotkey("mod+shift+e", exportCurrent, { id: "export", scope: G, label: s("export"), allowInInputs: true });
  useHotkey("mod+,", () => router.push("/settings"), { id: "settings", scope: G, label: s("settings"), allowInInputs: true });
  useHotkey("shift+/", openShortcuts, { id: "shortcuts", scope: G, label: s("sheet") });
  useHotkey("g h", () => router.push("/home"), { id: "go-home", scope: G, label: s("goHome") });
  useHotkey("g a", () => router.push("/ask"), { id: "go-ask", scope: G, label: s("goAsk") });
  useHotkey("g p", () => router.push("/checklists"), { id: "go-procedures", scope: G, label: s("goProcedures") });
  useHotkey("g s", () => router.push("/settings"), { id: "go-settings", scope: G, label: s("goSettings") });

  const api = useMemo<CommandApi>(
    () => ({
      paletteOpen,
      openPalette,
      closePalette,
      openShortcuts,
      toggleSidebar,
      newConversation,
      canExport,
      exportCurrent,
      exportConversation,
      requestSignOut,
    }),
    [paletteOpen, openPalette, closePalette, openShortcuts, toggleSidebar, newConversation, canExport, exportCurrent, exportConversation, requestSignOut],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      {user.role === "admin" && <AdminHotkeys />}
      <ShortcutsSheet open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </Ctx.Provider>
  );
}

/** Mounted for administrators only, so members never see the chord listed. */
function AdminHotkeys() {
  const s = useTranslations("shortcuts");
  const router = useRouter();
  useHotkey("g d", () => router.push("/admin"), { id: "go-admin", scope: "global", label: s("goAdmin") });
  return null;
}

export function useCommandApi(): CommandApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCommandApi() must be used inside <CommandProvider>.");
  return ctx;
}

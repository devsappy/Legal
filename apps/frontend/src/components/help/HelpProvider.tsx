"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { usePersisted } from "@/hooks/usePersisted";
import { LATEST_CHANGELOG_ID } from "@/content/changelog";
import { HelpPanel } from "./HelpPanel";
import { WhatsNew } from "./WhatsNew";

export type HelpTab = "guide" | "faq" | "shortcuts" | "status";

export const HELP_TABS: HelpTab[] = ["guide", "faq", "shortcuts", "status"];

type HelpApi = {
  open: boolean;
  tab: HelpTab;
  setTab: (tab: HelpTab) => void;
  openHelp: (tab?: HelpTab) => void;
  closeHelp: () => void;
  whatsNewOpen: boolean;
  openWhatsNew: () => void;
  closeWhatsNew: () => void;
  /** True until "What's new" has been opened once since the latest entry. */
  unread: boolean;
};

const Ctx = createContext<HelpApi | null>(null);

const TAB_KEY = "coop.help.tab";
const SEEN_KEY = "coop.changelog.seen";

/**
 * Owns the help drawer and the What's-new sheet so the top bar, the user
 * menu, the command palette and the sidebar can all open them. The last
 * tab is remembered per device; the unread dot clears once What's new has
 * been opened for the current LATEST_CHANGELOG_ID.
 */
export function HelpProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [storedTab, setStoredTab] = usePersisted<HelpTab>(TAB_KEY, "guide");
  const [seen, setSeen] = usePersisted<string>(SEEN_KEY, "");
  const hydrated = useHydrated();
  const tab: HelpTab = HELP_TABS.includes(storedTab) ? storedTab : "guide";

  const openHelp = useCallback(
    (next?: HelpTab) => {
      if (next) setStoredTab(next);
      setOpen(true);
    },
    [setStoredTab],
  );
  const closeHelp = useCallback(() => setOpen(false), []);
  const openWhatsNew = useCallback(() => {
    setSeen(LATEST_CHANGELOG_ID);
    setWhatsNewOpen(true);
  }, [setSeen]);
  const closeWhatsNew = useCallback(() => setWhatsNewOpen(false), []);

  const api = useMemo<HelpApi>(
    () => ({
      open,
      tab,
      setTab: setStoredTab,
      openHelp,
      closeHelp,
      whatsNewOpen,
      openWhatsNew,
      closeWhatsNew,
      // Before hydration the stored value is unknown; no dot rather than a flash.
      unread: hydrated && seen !== LATEST_CHANGELOG_ID,
    }),
    [open, tab, setStoredTab, openHelp, closeHelp, whatsNewOpen, openWhatsNew, closeWhatsNew, hydrated, seen],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <HelpPanel />
      <WhatsNew />
    </Ctx.Provider>
  );
}

export function useHelp(): HelpApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHelp() must be used inside <HelpProvider>.");
  return ctx;
}

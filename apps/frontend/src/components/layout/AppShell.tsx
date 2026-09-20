"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { CircleHelp, Download, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { pick, type SessionUser } from "@sahayak/shared";
import { Link, usePathname } from "@/i18n/navigation";
import { useChatContext } from "@/components/chat/ChatProvider";
import { CommandPalette } from "@/components/command/CommandPalette";
import { SIDEBAR_KEY, useCommandApi, type SidebarMode } from "@/components/command/CommandProvider";
import { useHelp } from "@/components/help/HelpProvider";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { usePersisted } from "@/hooks/usePersisted";
import { usePrefs } from "@/lib/prefs";
import { loadProcedures, useProcedures } from "@/lib/procedures-client";
import { routeFor } from "@/lib/routes";
import { ConversationCrumb } from "./ConversationCrumb";
import { JurisdictionSelect } from "./JurisdictionSelect";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileDrawer } from "./MobileDrawer";
import { Sidebar } from "./Sidebar";
import { SidebarRail } from "./SidebarRail";
import { StatusIndicator } from "./StatusIndicator";
import { SyncStatus } from "./SyncStatus";
import { ThemeToggle } from "./ThemeToggle";
import { TopBarOverflow } from "./TopBarOverflow";
import { UserMenu } from "./UserMenu";

const RAIL_W = 56;
const SIDEBAR_W = 272;

/** Admin sub-pages whose labels already exist in the admin namespace. */
const ADMIN_SECTIONS = new Set(["documents", "glossary", "queries"]);
const SETTINGS_SECTIONS = new Set(["preferences", "data"]);

/**
 * Sidebar (or the 56px rail) on the left, everything else on an inset
 * sheet: a top bar with breadcrumbs, the Act picker, health, help and the
 * account, then the page. Below `lg` the sidebar is a drawer behind the
 * hamburger. The sidebar mode is remembered per device (coop.sidebar) and
 * toggled with Ctrl/⌘ B.
 */
export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [mode] = usePersisted<SidebarMode>(SIDEBAR_KEY, "expanded");
  const { toggleSidebar } = useCommandApi();
  const [drawer, setDrawer] = useState(false);
  const prefs = usePrefs();
  const reduce = Boolean(useReducedMotion()) || prefs.reduceMotion;
  const rail = mode === "rail";

  // Navigating closes the drawer (the Drawer primitive handles Escape and the backdrop).
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setDrawer(false);
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-(--z-skip) focus:rounded-md focus:bg-sheet focus:px-3 focus:py-2 focus:shadow-popover"
      >
        {t("nav.skip")}
      </a>

      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar / rail */}
        <motion.aside
          data-print="hide"
          data-motion
          initial={false}
          animate={{ width: rail ? RAIL_W : SIDEBAR_W }}
          transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          className="hidden h-full shrink-0 overflow-hidden lg:flex lg:flex-col"
        >
          <div className="h-full" style={{ width: rail ? RAIL_W : SIDEBAR_W }}>
            {rail ? (
              <SidebarRail user={user} onExpand={toggleSidebar} />
            ) : (
              <Sidebar user={user} onCollapse={toggleSidebar} />
            )}
          </div>
        </motion.aside>

        {/* Tablet / phone drawer */}
        <MobileDrawer open={drawer} onOpenChange={setDrawer} user={user} />

        {/* Content sheet */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-2 lg:p-2.5 lg:pl-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-rule bg-sheet shadow-raised">
            <TopBar user={user} rail={rail} onToggleRail={toggleSidebar} onMenu={() => setDrawer(true)} />
            <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </div>

      <CommandPalette user={user} />
    </>
  );
}

/* ---- breadcrumbs from the route map --------------------------------------- */

function useCrumbs(pathname: string): Crumb[] {
  const t = useTranslations();
  const locale = useLocale();
  const { procedures } = useProcedures();
  const route = routeFor(pathname);
  const segments = pathname.split("/").filter(Boolean);
  const slug = route?.key === "checklists" && segments[1] ? decodeURIComponent(segments[1]) : null;

  // A checklist page needs the procedure's title; the list is cached per page load.
  useEffect(() => {
    if (slug) void loadProcedures();
  }, [slug]);

  if (!route) return [];
  const items: Crumb[] = [{ label: t(`nav.${route.navKey}`), href: route.href }];
  if (slug) {
    const p = procedures.find((x) => x.slug === slug);
    if (p) items.push({ label: pick(p.title, locale) });
  }
  if (route.key === "admin" && segments[1] && ADMIN_SECTIONS.has(segments[1])) {
    items.push({ label: t(`admin.${segments[1]}`) });
  }
  if (route.key === "settings" && segments[1] && SETTINGS_SECTIONS.has(segments[1])) {
    items.push({ label: t(`settings.nav.${segments[1]}`) });
  }
  return items;
}

/* ---- top bar --------------------------------------------------------------- */

function TopBar({
  user,
  rail,
  onToggleRail,
  onMenu,
}: {
  user: SessionUser;
  rail: boolean;
  onToggleRail: () => void;
  onMenu: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const onAsk = pathname === "/ask";
  const crumbs = useCrumbs(pathname);
  const chat = useChatContext();
  const { canExport, exportCurrent } = useCommandApi();
  const { openHelp, unread } = useHelp();

  return (
    <header
      data-print="hide"
      className="flex h-14 shrink-0 items-center gap-1.5 border-b border-rule/70 px-2.5 sm:gap-2 sm:px-4"
    >
      <IconButton label={t("shell.menu")} size="sm" onClick={onMenu} className="lg:hidden" tooltip={false}>
        <Menu size={18} />
      </IconButton>
      <IconButton
        label={rail ? t("shell.expand") : t("shell.rail")}
        size="sm"
        onClick={onToggleRail}
        className="text-ink-3 max-lg:hidden"
      >
        {rail ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
      </IconButton>

      {/* Breadcrumbs; on /ask the trail ends in the editable conversation title. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        {onAsk ? (
          <>
            <nav aria-label={t("ui.breadcrumb")} className="min-w-0">
              <ol className="flex min-w-0 items-center gap-1 text-xs text-ink-3">
                <li className="flex min-w-0 items-center">
                  <Link href="/ask" className="truncate rounded-sm transition-colors hover:text-ink">
                    {t("nav.chat")}
                  </Link>
                </li>
                <li className="flex min-w-0 items-center gap-1 empty:hidden">
                  <ConversationCrumb separator />
                </li>
              </ol>
            </nav>
            {chat.messages.length > 0 && <SyncStatus className="max-sm:hidden" />}
          </>
        ) : (
          crumbs.length > 0 && <Breadcrumbs items={crumbs} />
        )}
      </div>

      {!onAsk && (
        <div className="hidden sm:block">
          <JurisdictionSelect />
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
        <StatusIndicator />
        <IconButton label={t("shell.help")} size="sm" onClick={() => openHelp()} className="text-ink-2">
          <CircleHelp size={17} />
          {unread && (
            <span aria-hidden className="absolute right-1 top-1 size-1.5 rounded-full bg-ink ring-2 ring-sheet" />
          )}
        </IconButton>
        <div className="hidden items-center gap-1 sm:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          {onAsk && (
            <Button
              size="sm"
              variant="outline"
              onClick={exportCurrent}
              disabled={!canExport}
              aria-label={t("shell.export")}
              className="rounded-full px-3"
            >
              <Download size={13} aria-hidden />
              <span className="hidden md:inline">{t("shell.export")}</span>
            </Button>
          )}
        </div>
        <TopBarOverflow showExport={onAsk} showJurisdiction={!onAsk} className="sm:hidden" />
        <UserMenu user={user} variant="avatar" align="end" side="bottom" className="lg:hidden" />
      </div>
    </header>
  );
}

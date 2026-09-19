"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, PanelLeftOpen, Download } from "lucide-react";
import clsx from "clsx";
import { usePathname } from "@/i18n/navigation";
import { useChatContext } from "@/components/chat/ChatProvider";
import { JURISDICTIONS } from "@/lib/config";
import { useJurisdiction } from "./JurisdictionProvider";
import { JurisdictionSelect } from "./JurisdictionSelect";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Sidebar } from "./Sidebar";
import type { SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

/**
 * Sidebar on the left, everything else on an inset white card.
 * Desktop can hide the sidebar; below `lg` it becomes a drawer.
 */
export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  // Route change closes the drawer; Escape does too.
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setDrawer(false);
  }
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-sheet focus:px-3 focus:py-2 focus:rounded-md focus:shadow"
      >
        {t("nav.skip")}
      </a>

      <div className="flex-1 flex min-h-0">
        {/* Desktop sidebar */}
        <aside
          className={clsx(
            "hidden shrink-0 w-[272px] h-full",
            !collapsed && "lg:flex lg:flex-col",
          )}
        >
          <Sidebar user={user} hotkey onCollapse={() => setCollapsed(true)} />
        </aside>

        {/* Mobile drawer */}
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label={t("shell.close")}
              onClick={() => setDrawer(false)}
              className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            />
            <aside className="rise absolute inset-y-0 left-0 w-[min(88vw,300px)] bg-shell flex flex-col shadow-2xl">
              <Sidebar user={user} onCollapse={() => setDrawer(false)} onNavigate={() => setDrawer(false)} />
            </aside>
          </div>
        )}

        {/* Content card */}
        <div
          className={clsx(
            "flex-1 flex flex-col min-w-0 min-h-0 p-2 lg:p-2.5",
            !collapsed && "lg:pl-0",
          )}
        >
          <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-rule bg-sheet overflow-hidden shadow-[0_1px_2px_rgba(9,9,11,0.04)]">
            <TopBar
              collapsed={collapsed}
              onExpand={() => setCollapsed(false)}
              onMenu={() => setDrawer(true)}
            />
            <main id="main" className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              {children}
            </main>
            <p className="shrink-0 px-4 py-2 text-center text-[11.5px] text-ink-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              {t("app.notice")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function TopBar({
  collapsed,
  onExpand,
  onMenu,
}: {
  collapsed: boolean;
  onExpand: () => void;
  onMenu: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const chat = useChatContext();
  const { jurisdiction } = useJurisdiction();
  const onAsk = pathname === "/ask";
  const hasChat = chat.messages.length > 0;

  const exportChat = () => {
    const act = JURISDICTIONS.find((j) => j.id === jurisdiction)?.act ?? jurisdiction;
    const lines: string[] = [`# ${t("app.name")}`, "", `${t("chat.answeringFrom")} ${act}`, ""];
    for (const m of chat.messages) {
      const who = m.role === "user" ? t("chat.you") : t("chat.assistant");
      lines.push(`**${who}:** ${m.text.trim()}`, "");
      if (m.citations.length) {
        lines.push(`${t("chat.sources")}:`);
        for (const c of m.citations) lines.push(`- [${c.id}] ${c.act} §${c.section} — ${c.title}`);
        lines.push("");
      }
    }
    lines.push(`_${t("app.notice")}_`);
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sahayak-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="shrink-0 h-14 px-3 sm:px-4 flex items-center gap-2 border-b border-rule/70">
      <button
        type="button"
        onClick={onMenu}
        aria-label={t("shell.menu")}
        className="lg:hidden h-8 w-8 inline-flex items-center justify-center rounded-md text-ink-2 hover:bg-muted"
      >
        <Menu size={18} />
      </button>
      {collapsed && (
        <button
          type="button"
          onClick={onExpand}
          aria-label={t("shell.expand")}
          className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-2 hover:bg-muted"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

      <JurisdictionSelect />

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        {onAsk && (
          <Button size="sm" variant="outline" onClick={exportChat} disabled={!hasChat} className="h-8 rounded-full px-3">
            <Download size={13} /> <span className="hidden sm:inline">{t("shell.export")}</span>
          </Button>
        )}
      </div>
    </header>
  );
}

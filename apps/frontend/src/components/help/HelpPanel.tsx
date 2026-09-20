"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Tabs } from "@/components/ui/Tabs";
import { useHealth } from "@/lib/health";
import { HELP_TABS, useHelp, type HelpTab } from "./HelpProvider";
import { GuideTab } from "./GuideTab";
import { FaqTab } from "./FaqTab";
import { StatusTab } from "./StatusTab";
import { ShortcutsList } from "@/components/command/ShortcutsSheet";

const ID = "help";

/**
 * Right-hand help drawer: Guide, FAQ, Shortcuts and Status. The tab
 * strip is a real tablist; each panel is mounted only while selected so
 * the FAQ accordion and the health rows are not rendered four times over.
 */
export function HelpPanel() {
  const t = useTranslations("help");
  const u = useTranslations("user");
  const { open, tab, setTab, closeHelp } = useHelp();
  const health = useHealth();

  const items = HELP_TABS.map((value) => ({ value, label: t(`tabs.${value}`) }));

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) closeHelp();
      }}
      side="right"
      width="min(92vw,420px)"
      title={t("title")}
      description={t("description")}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-ink-3">
          <span className="flex items-center gap-2">
            <Link href="/privacy" className="hover:text-ink">
              {u("privacy")}
            </Link>
            <span aria-hidden>·</span>
            <Link href="/terms" className="hover:text-ink">
              {u("terms")}
            </Link>
          </span>
          <span className="font-mono">
            {t("version")} {health.version ?? "—"}
          </span>
        </div>
      }
    >
      <Tabs ariaLabel={t("title")} items={items} value={tab} onValueChange={(v) => setTab(v as HelpTab)} idPrefix={ID} className="-mx-5 px-5" />
      <div
        role="tabpanel"
        id={`${ID}-panel-${tab}`}
        aria-labelledby={`${ID}-tab-${tab}`}
        tabIndex={0}
        className="pt-5 outline-none"
      >
        {tab === "guide" && <GuideTab />}
        {tab === "faq" && <FaqTab />}
        {tab === "shortcuts" && <ShortcutsList />}
        {tab === "status" && <StatusTab />}
      </div>
    </Drawer>
  );
}

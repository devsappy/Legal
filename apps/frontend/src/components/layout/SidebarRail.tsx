"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import { PanelLeftOpen, Plus } from "lucide-react";
import type { SessionUser } from "@sahayak/shared";
import { Link, usePathname } from "@/i18n/navigation";
import { useCommandApi } from "@/components/command/CommandProvider";
import { BrandMark } from "@/components/ui/BrandMark";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { routesFor } from "@/lib/routes";
import { SyncStatus } from "./SyncStatus";
import { UserMenu } from "./UserMenu";

/**
 * The 56px icon rail shown when the sidebar is collapsed: brand, expand,
 * new conversation, the primary routes (Tooltips carry the labels) and the
 * account menu at the bottom. Conversations are reached through the
 * palette (Ctrl/⌘ K) or by expanding the sidebar again.
 */
export function SidebarRail({ user, onExpand }: { user: SessionUser; onExpand: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const { newConversation } = useCommandApi();

  return (
    <div className="flex h-full w-14 flex-col items-center gap-2 py-3">
      <Link href="/home" aria-label={t("app.name")} className="rounded-lg">
        <BrandMark />
      </Link>
      <IconButton label={t("shell.expand")} size="sm" onClick={onExpand} className="text-ink-3">
        <PanelLeftOpen size={16} />
      </IconButton>

      <Tooltip content={t("chat.newChat")} side="right">
        <button
          type="button"
          onClick={newConversation}
          aria-label={t("chat.newChat")}
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-paper shadow-raised transition-opacity hover:opacity-90 active:translate-y-px"
        >
          <Plus size={16} strokeWidth={2.25} aria-hidden />
        </button>
      </Tooltip>

      <nav aria-label={t("shell.primaryNav")} className="mt-1">
        <ul className="flex flex-col gap-1">
          {routesFor(user.role).map((route) => {
            const active = route.match(pathname);
            const Icon = route.icon;
            const label = t(`nav.${route.navKey}`);
            return (
              <li key={route.key}>
                <Tooltip content={label} side="right">
                  <Link
                    href={route.href}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      active ? "bg-sheet text-ink ring-1 ring-rule" : "text-ink-2 hover:bg-sheet/70 hover:text-ink",
                    )}
                  >
                    <Icon size={17} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                  </Link>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2">
        <SyncStatus variant="dot" />
        <UserMenu user={user} variant="avatar" align="start" side="top" />
      </div>
    </div>
  );
}

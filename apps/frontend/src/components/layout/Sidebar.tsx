"use client";

import { useMemo, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { MessageSquarePlus, PanelLeftClose, Plus, Search } from "lucide-react";
import clsx from "clsx";
import type { SessionUser } from "@sahayak/shared";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useChatContext } from "@/components/chat/ChatProvider";
import { useCommandApi } from "@/components/command/CommandProvider";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Kbd } from "@/components/ui/Kbd";
import { Skeleton } from "@/components/ui/Skeleton";
import { useHydrated } from "@/hooks/useHydrated";
import {
  bucketOf,
  cancelDelete,
  commitDelete,
  pushToServer,
  removeConversation,
  saveConversation,
  scheduleDelete,
  useHistory,
  type Conversation,
  type HistoryBucket,
} from "@/lib/history";
import { togglePin, unpin, usePins } from "@/lib/pins";
import { routesFor } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { ConversationRow } from "./ConversationRow";
import { UserMenu } from "./UserMenu";

const BUCKETS: HistoryBucket[] = ["today", "yesterday", "week", "older"];
/** The undo toast's lifetime; the server delete fires when it closes. */
const UNDO_MS = 6000;

type Props = {
  user: SessionUser;
  /** Desktop: collapse to the rail. In the drawer: close it. */
  onCollapse: () => void;
  /** Called after a nav or history pick, so a drawer can close. */
  onNavigate?: () => void;
  /**
   * True inside the phone/tablet drawer. The drawer is a modal <dialog>, so
   * anything portalled to <body> from inside it (menus, popovers) would be
   * inert; rows show inline actions and the footer has no menu there.
   */
  inDrawer?: boolean;
};

/**
 * The expanded sidebar: brand, new conversation, a search button that
 * opens the palette, the primary routes, pinned and dated conversations,
 * and the account menu. Three skeleton rows hold the list's place until
 * localStorage is readable so an empty state never flashes on reload.
 */
export function Sidebar({ user, onCollapse, onNavigate, inDrawer }: Props) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const chat = useChatContext();
  const api = useCommandApi();
  const history = useHistory();
  const pins = usePins();
  const hydrated = useHydrated();

  const goToAsk = () => {
    if (pathname !== "/ask") router.push("/ask");
    onNavigate?.();
  };

  const openConversation = (id: string) => {
    chat.open(id);
    goToAsk();
  };

  const startNew = () => {
    api.newConversation();
    onNavigate?.();
  };

  /**
   * Optimistic delete: the row goes at once, the server copy waits for the
   * undo toast to close (or the page to hide). Undo re-saves locally and
   * re-sends the transcript, so the server never sees a gap.
   */
  const deleteConversation = (c: Conversation) => {
    const wasPinned = pins.includes(c.id);
    removeConversation(c.id);
    scheduleDelete(c.id);
    if (c.id === chat.sessionId) chat.reset();
    toast.undo(
      t("shell.deleted"),
      () => {
        cancelDelete(c.id);
        saveConversation(c);
        pushToServer(c);
      },
      {
        duration: UNDO_MS,
        onDismiss: () => {
          commitDelete(c.id);
          if (wasPinned) unpin(c.id);
        },
      },
    );
    // From the modal drawer the toast would be inert until the drawer closes; close it now.
    onNavigate?.();
  };

  const { pinned, grouped } = useMemo(() => {
    const pinnedSet = new Set(pins);
    const pinnedRows = pins.map((id) => history.find((c) => c.id === id)).filter((c): c is Conversation => Boolean(c));
    const groups = new Map<HistoryBucket, Conversation[]>();
    for (const c of history) {
      if (pinnedSet.has(c.id)) continue;
      const b = bucketOf(c.updatedAt);
      groups.set(b, [...(groups.get(b) ?? []), c]);
    }
    return { pinned: pinnedRows, grouped: groups };
  }, [history, pins]);

  // Roving tabindex: the open conversation (or the first row) is the one Tab reaches.
  const ordered = [...pinned, ...BUCKETS.flatMap((b) => grouped.get(b) ?? [])];
  const activeId = pathname === "/ask" ? chat.sessionId : "";
  const tabbableId = ordered.some((c) => c.id === activeId) ? activeId : (ordered[0]?.id ?? "");

  const onListKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-row]"));
    if (!rows.length) return;
    const current = rows.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;
    e.preventDefault();
    const next =
      e.key === "ArrowDown"
        ? (current + 1) % rows.length
        : e.key === "ArrowUp"
          ? (current - 1 + rows.length) % rows.length
          : e.key === "Home"
            ? 0
            : rows.length - 1;
    rows[next]?.focus();
  };

  const renderRows = (list: Conversation[]) => (
    <ul className="space-y-px">
      {list.map((c) => (
        <ConversationRow
          key={c.id}
          conversation={c}
          active={c.id === activeId}
          working={c.id === activeId && chat.busy}
          pinned={pins.includes(c.id)}
          tabbable={c.id === tabbableId}
          inline={inDrawer}
          onOpen={() => openConversation(c.id)}
          onTogglePin={() => togglePin(c.id)}
          onExport={() => api.exportConversation(c)}
          onDelete={() => deleteConversation(c)}
        />
      ))}
    </ul>
  );

  return (
    <div className={clsx("flex h-full min-h-0 flex-col gap-3", inDrawer ? "-mx-2 -mb-2" : "px-3 pb-3 pt-3")}>
      {/* Brand (the drawer shows the name in its own header) */}
      {!inDrawer && (
        <div className="flex h-8 items-center gap-2.5 px-1">
          <Link href="/home" className="flex min-w-0 items-center gap-2.5 rounded-md" onClick={onNavigate}>
            <BrandMark />
            <span className="truncate text-base font-semibold tracking-tight text-ink">{t("app.name")}</span>
          </Link>
          <button
            type="button"
            onClick={onCollapse}
            aria-label={t("shell.rail")}
            title={t("shell.rail")}
            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-muted hover:text-ink"
          >
            <PanelLeftClose size={16} aria-hidden />
          </button>
        </div>
      )}

      {/* New conversation */}
      <Button variant="primary" size="md" onClick={startNew} className="w-full">
        <Plus size={15} strokeWidth={2.25} aria-hidden />
        {t("chat.newChat")}
      </Button>

      {/* Search: opens the palette */}
      <button
        type="button"
        onClick={api.openPalette}
        className="flex h-8 w-full items-center gap-2 rounded-lg border border-rule bg-sheet px-2.5 text-left text-xs text-ink-3 transition-colors hover:border-rule-strong hover:text-ink-2"
      >
        <Search size={14} aria-hidden />
        <span className="min-w-0 flex-1 truncate">{t("shell.search")}</span>
        <Kbd combo="mod+k" />
      </button>

      {/* Primary nav */}
      <nav aria-label={t("shell.primaryNav")}>
        <ul className="space-y-0.5">
          {routesFor(user.role).map((route) => {
            const active = route.match(pathname);
            const Icon = route.icon;
            return (
              <li key={route.key}>
                <Link
                  href={route.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex h-8 items-center gap-2.5 rounded-lg px-2 text-sm transition-colors",
                    active ? "bg-sheet font-medium text-ink ring-1 ring-rule" : "text-ink-2 hover:bg-sheet/70 hover:text-ink",
                  )}
                >
                  <Icon size={16} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                  {t(`nav.${route.navKey}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* History */}
      <nav
        aria-label={t("shell.conversations")}
        aria-busy={!hydrated}
        onKeyDown={onListKeyDown}
        className="scroll-thin -mx-1 min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-1"
      >
        {!hydrated ? (
          <div className="space-y-1.5 px-2 pt-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-11/12" />
            <Skeleton className="h-7 w-4/5" />
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            compact
            icon={<MessageSquarePlus size={18} strokeWidth={1.75} />}
            title={t("shell.noHistoryTitle")}
            description={t("shell.noHistoryBody")}
            action={
              <Button size="sm" variant="outline" onClick={startNew}>
                {t("shell.startFirst")}
              </Button>
            }
          />
        ) : (
          <>
            {pinned.length > 0 && (
              <section className="mb-3" aria-labelledby="sidebar-pinned">
                <h2 id="sidebar-pinned" className="mb-1 px-2 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
                  {t("shell.pinned")}
                </h2>
                {renderRows(pinned)}
              </section>
            )}
            {BUCKETS.filter((b) => grouped.has(b)).map((b) => (
              <section key={b} className="mb-3" aria-labelledby={`sidebar-${b}`}>
                <h2 id={`sidebar-${b}`} className="mb-1 px-2 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
                  {t(`shell.${b}`)}
                </h2>
                {renderRows(grouped.get(b)!)}
              </section>
            ))}
          </>
        )}
      </nav>

      {/* Signed-in user */}
      <UserMenu user={user} variant={inDrawer ? "static" : "full"} align="start" side="top" />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, MessageSquareText } from "lucide-react";
import clsx from "clsx";
import { Link, useRouter } from "@/i18n/navigation";
import { useChatContext } from "@/components/chat/ChatProvider";
import { getConversation, syncFromServer } from "@/lib/history";
import { formatNumber, relativeTime } from "@/lib/format";
import { askHref } from "@/lib/routes";
import { useNow } from "@/hooks/useNow";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

/** The slice of a conversation the page sends down: no transcript. */
export type RecentConversation = {
  id: string;
  title: string;
  updatedAt: number;
  /** Number of messages, user and assistant together. */
  count: number;
};

type Props = {
  /** Newest first, at most five; null when the fetch failed. */
  items: RecentConversation[] | null;
  /** The server's clock for the relative times on the first paint. */
  serverNow: number;
};

/**
 * The five most recent conversations. Opening one hands it to the shared
 * chat session (the same path the sidebar uses) and goes to /ask; if the
 * device has not synced it yet, the server copy is pulled first.
 */
export function ContinueList({ items, serverNow }: Props) {
  const t = useTranslations("home");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const router = useRouter();
  const chat = useChatContext();
  const [opening, setOpening] = useState<string | null>(null);
  const now = useNow(serverNow);

  const open = async (id: string) => {
    if (opening) return;
    setOpening(id);
    try {
      if (!getConversation(id)) await syncFromServer();
      chat.open(id);
      router.push("/ask");
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-medium text-ink">{t("continueTitle")}</h2>
        {items && items.length > 0 && (
          <Link href="/ask" className="shrink-0 rounded-sm text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline">
            {t("viewAll")}
          </Link>
        )}
      </div>

      {items === null ? (
        <EmptyState
          compact
          tone="error"
          title={t("loadFailed")}
          action={
            <Button size="sm" onClick={() => router.refresh()}>
              {tUi("retry")}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={<MessageSquareText size={18} strokeWidth={1.75} />}
          title={t("noConversations")}
          description={t("noConversationsBody")}
          action={
            <Link href={askHref()} className={buttonClasses("primary", "sm")}>
              {t("startFirst")}
            </Link>
          }
        />
      ) : (
        <ul className="-mx-2 mt-3 flex flex-col">
          {items.map((c) => {
            const busy = opening === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => void open(c.id)}
                  aria-busy={busy || undefined}
                  disabled={opening !== null && !busy}
                  className={clsx(
                    "group/row flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                    "hover:bg-muted disabled:cursor-default disabled:opacity-60",
                  )}
                  style={{ outlineOffset: -2 }}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-ink-2">
                    {busy ? <Spinner size={14} /> : <MessageSquareText size={15} strokeWidth={1.75} aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{c.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-3">
                      <span className="font-mono">{relativeTime(c.updatedAt, locale, now)}</span>
                      <span aria-hidden> · </span>
                      {t("messages", { count: c.count, n: formatNumber(c.count, locale) })}
                    </span>
                  </span>
                  <span className="sr-only">{t("openConversation")}</span>
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-ink-3 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible/row:opacity-100 motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
                    aria-hidden
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

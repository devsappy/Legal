"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Pencil } from "lucide-react";
import { useChatContext } from "@/components/chat/ChatProvider";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Tooltip } from "@/components/ui/Tooltip";
import { JURISDICTIONS } from "@/lib/config";
import { renameConversation, useHistory } from "@/lib/history";
import { useJurisdiction } from "./JurisdictionProvider";

/**
 * The last breadcrumb on /ask: the open conversation's title, editable in
 * place (pencil or Enter starts, Enter saves, Escape cancels), plus the
 * Act the assistant is answering from. Renders nothing before the first
 * question, when there is no conversation to name yet.
 */
export function ConversationCrumb({ separator }: { separator?: boolean }) {
  const t = useTranslations("shell");
  const chat = useChatContext();
  const history = useHistory();
  const { jurisdiction } = useJurisdiction();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const wrap = useRef<HTMLSpanElement>(null);
  // Escape must win over the blur the unmounting input may still fire.
  const escaped = useRef(false);

  const stored = chat.sessionId ? history.find((c) => c.id === chat.sessionId) : undefined;
  const firstUser = chat.messages.find((m) => m.role === "user");
  const title = stored?.title ?? firstUser?.text.replace(/\s+/g, " ").slice(0, 96);
  const act = JURISDICTIONS.find((j) => j.id === jurisdiction);

  // Switching conversations while editing abandons the edit.
  const [prevId, setPrevId] = useState(chat.sessionId);
  if (chat.sessionId !== prevId) {
    setPrevId(chat.sessionId);
    setEditing(false);
  }

  if (!title) return null;

  const start = () => {
    if (!stored) return;
    escaped.current = false;
    setDraft(stored.title);
    setEditing(true);
  };
  const refocus = () => {
    requestAnimationFrame(() => wrap.current?.querySelector<HTMLElement>("[data-title]")?.focus({ preventScroll: true }));
  };
  const commit = () => {
    if (escaped.current) {
      escaped.current = false;
      return;
    }
    if (stored && draft.trim() && draft.trim() !== stored.title) renameConversation(stored.id, draft);
    setEditing(false);
    refocus();
  };
  const cancel = () => {
    escaped.current = true;
    setEditing(false);
    refocus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <>
      {separator && <ChevronRight size={12} className="shrink-0" aria-hidden />}
      <span ref={wrap} className="flex min-w-0 items-center gap-1.5">
        {editing ? (
          <Input
            size="sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={commit}
            aria-label={t("renameLabel")}
            title={t("renameHint")}
            autoFocus
            maxLength={96}
            className="w-[min(60vw,320px)]"
          />
        ) : (
          <>
            <button
              type="button"
              data-title
              onClick={start}
              disabled={!stored}
              aria-current="page"
              title={stored ? t("rename") : undefined}
              className="min-w-0 truncate rounded-sm text-xs font-medium text-ink underline-offset-4 enabled:hover:underline disabled:cursor-default"
            >
              {title}
            </button>
            {stored && (
              <IconButton label={t("rename")} size="sm" onClick={start} className="text-ink-3">
                <Pencil size={13} />
              </IconButton>
            )}
          </>
        )}
        {act && (
          <Tooltip content={t("currentAct", { act: act.act })} side="bottom">
            <span className="hidden md:inline-flex">
              <Badge kind="neutral" mono>
                {act.short}
              </Badge>
            </span>
          </Tooltip>
        )}
      </span>
    </>
  );
}

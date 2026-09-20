"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/Tooltip";
import { renameConversation, type Conversation } from "@/lib/history";
import { ConversationMenu } from "./ConversationMenu";

type Props = {
  conversation: Conversation;
  active: boolean;
  /** The assistant is still answering in this conversation. */
  working: boolean;
  pinned: boolean;
  /** Roving tabindex: exactly one row in the list is reachable with Tab. */
  tabbable: boolean;
  /**
   * Inline pin/delete buttons instead of the "⋯" menu. Used inside the
   * modal drawer, where a portalled menu would land outside the top layer
   * and be inert.
   */
  inline?: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
  onExport: () => void;
  onDelete: () => void;
};

/**
 * One sidebar conversation. The title button is the row (Tooltip shows the
 * full title, Delete key deletes, F2 renames); the "⋯" menu appears on
 * hover and focus and stays visible on touch screens. Renaming swaps the
 * button for an input in place: Enter saves, Escape cancels.
 */
export function ConversationRow({
  conversation: c,
  active,
  working,
  pinned,
  tabbable,
  inline,
  onOpen,
  onTogglePin,
  onExport,
  onDelete,
}: Props) {
  const t = useTranslations("shell");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const item = useRef<HTMLLIElement>(null);
  // Escape must win over the blur the unmounting input may still fire.
  const escaped = useRef(false);

  const start = () => {
    escaped.current = false;
    setDraft(c.title);
    setEditing(true);
  };
  /** Hands focus back to the row once the input is gone. */
  const refocus = () => {
    requestAnimationFrame(() => item.current?.querySelector<HTMLElement>("[data-row]")?.focus({ preventScroll: true }));
  };
  const commit = () => {
    if (escaped.current) {
      escaped.current = false;
      return;
    }
    if (draft.trim() && draft.trim() !== c.title) renameConversation(c.id, draft);
    setEditing(false);
    refocus();
  };
  const cancel = () => {
    escaped.current = true;
    setEditing(false);
    refocus();
  };

  const onRowKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Delete") {
      e.preventDefault();
      onDelete();
    } else if (e.key === "F2") {
      e.preventDefault();
      start();
    }
  };
  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
    // Arrow keys belong to the text field while editing.
    e.stopPropagation();
  };

  return (
    <li ref={item} className="group relative" data-conversation={c.id}>
      {editing ? (
        <Input
          size="sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onInputKey}
          onBlur={commit}
          aria-label={t("renameLabel")}
          title={t("renameHint")}
          autoFocus
          maxLength={96}
          className="w-full"
        />
      ) : (
        <Tooltip content={c.title} side="right">
          <button
            type="button"
            data-row
            tabIndex={tabbable ? 0 : -1}
            aria-current={active ? "location" : undefined}
            onClick={onOpen}
            onKeyDown={onRowKey}
            className={clsx(
              "flex h-8 w-full items-center gap-1.5 rounded-lg pl-2 text-left text-sm transition-colors",
              inline ? "pr-16" : "pr-8",
              active ? "bg-sheet font-medium text-ink ring-1 ring-rule" : "text-ink-2 hover:bg-sheet/70 hover:text-ink",
            )}
          >
            {pinned && <Pin size={11} className="shrink-0 text-ink-3" aria-hidden />}
            <span className="min-w-0 flex-1 truncate">{c.title}</span>
          </button>
        </Tooltip>
      )}
      {!editing &&
        (working ? (
          // The composer announces progress; this glyph is purely visual.
          <span aria-hidden className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-2">
            <Spinner size={12} />
          </span>
        ) : inline ? (
          <span className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center">
            <IconButton label={pinned ? t("unpin") : t("pin")} tooltip={false} size="sm" onClick={onTogglePin} className="text-ink-3">
              {pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </IconButton>
            <IconButton label={t("delete")} tooltip={false} size="sm" onClick={onDelete} className="text-ink-3 hover:text-seal">
              <Trash2 size={14} />
            </IconButton>
          </span>
        ) : (
          <ConversationMenu
            title={c.title}
            pinned={pinned}
            onOpen={onOpen}
            onRename={start}
            onTogglePin={onTogglePin}
            onExport={onExport}
            onDelete={onDelete}
            className={clsx(
              "absolute right-0 top-1/2 -translate-y-1/2 text-ink-3",
              "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 aria-expanded:opacity-100",
              "[@media(hover:none)]:opacity-100",
            )}
          />
        ))}
    </li>
  );
}

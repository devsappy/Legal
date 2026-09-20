"use client";

import { useTranslations } from "next-intl";
import { Download, Ellipsis, MessageSquareText, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { DropdownMenu, MenuItem, MenuSeparator } from "@/components/ui/DropdownMenu";

type Props = {
  title: string;
  pinned: boolean;
  onOpen: () => void;
  onRename: () => void;
  onTogglePin: () => void;
  onExport: () => void;
  onDelete: () => void;
  className?: string;
};

/**
 * The "⋯" menu on a sidebar conversation row. The trigger is a bare
 * IconButton (no Tooltip) because DropdownMenu clones it to attach its
 * aria wiring; the row itself carries the title so the menu's name reads
 * "Conversation actions, {title}".
 */
export function ConversationMenu({ title, pinned, onOpen, onRename, onTogglePin, onExport, onDelete, className }: Props) {
  const t = useTranslations("shell");
  return (
    <DropdownMenu
      align="end"
      label={`${t("moreActions")} — ${title}`}
      trigger={
        <IconButton label={t("moreActions")} tooltip={false} size="sm" className={className}>
          <Ellipsis size={15} />
        </IconButton>
      }
    >
      <MenuItem icon={<MessageSquareText size={14} />} onSelect={onOpen}>
        {t("open")}
      </MenuItem>
      <MenuItem icon={<Pencil size={14} />} onSelect={onRename}>
        {t("rename")}
      </MenuItem>
      <MenuItem icon={pinned ? <PinOff size={14} /> : <Pin size={14} />} onSelect={onTogglePin}>
        {pinned ? t("unpin") : t("pin")}
      </MenuItem>
      <MenuItem icon={<Download size={14} />} onSelect={onExport}>
        {t("exportOne")}
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={<Trash2 size={14} />} destructive onSelect={onDelete}>
        {t("deleteTitle")}
      </MenuItem>
    </DropdownMenu>
  );
}

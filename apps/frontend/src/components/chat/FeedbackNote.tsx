"use client";

import { useId, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { Textarea } from "@/components/ui/Textarea";

type Props = {
  /** The Not-helpful button; the popover anchors to it. */
  trigger: ReactElement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called once with the note (or nothing when skipped); the caller records the thumbs-down. */
  onSubmit: (note?: string) => void;
};

const MAX = 500;

/**
 * A small anchored form asking what went wrong. Closing it any other way
 * (Escape, outside press, Skip) still records the thumbs-down without a
 * note; the parent decides that through onOpenChange.
 */
export function FeedbackNote({ trigger, open, onOpenChange, onSubmit }: Props) {
  const t = useTranslations("chat");
  const id = useId();
  const [note, setNote] = useState("");

  const finish = (text?: string) => {
    onSubmit(text);
    setNote("");
    onOpenChange(false);
  };

  return (
    <Popover trigger={trigger} open={open} onOpenChange={onOpenChange} side="top" align="end" ariaLabel={t("noteLabel")} className="w-[min(92vw,320px)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          finish(note.trim() || undefined);
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {t("noteLabel")}
        </label>
        <Textarea
          id={id}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, MAX))}
          rows={3}
          placeholder={t("notePlaceholder")}
          maxLength={MAX}
          data-autofocus
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              finish(note.trim() || undefined);
            }
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-2xs tabular-nums text-ink-3">
            {note.length}/{MAX}
          </span>
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="ghost" onClick={() => finish(undefined)}>
              {t("skipNote")}
            </Button>
            <Button type="submit" size="sm" variant="primary" disabled={!note.trim()}>
              {t("sendNote")}
            </Button>
          </div>
        </div>
      </form>
    </Popover>
  );
}

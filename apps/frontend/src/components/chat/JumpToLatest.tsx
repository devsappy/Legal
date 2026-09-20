"use client";

import { useTranslations } from "next-intl";
import { ArrowDown } from "lucide-react";
import clsx from "clsx";

type Props = {
  visible: boolean;
  onClick: () => void;
  className?: string;
};

/**
 * Ink pill pinned above the composer while the reader has scrolled away
 * from a streaming answer. Sits outside the scroll container (absolute in
 * the transcript column; the parent sets its vertical offset), so it never
 * scrolls with the log.
 */
export function JumpToLatest({ visible, onClick, className }: Props) {
  const t = useTranslations("chat");
  return (
    <div
      className={clsx(
        "pointer-events-none absolute inset-x-0 z-(--z-sticky) flex justify-center transition-[opacity,transform] duration-(--dur-2) ease-standard motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className,
      )}
      data-motion
      aria-hidden={!visible}
    >
      <button
        type="button"
        onClick={onClick}
        tabIndex={visible ? 0 : -1}
        className="pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-medium text-paper shadow-popover transition-opacity hover:opacity-90 active:translate-y-px"
      >
        {t("newAnswer")}
        <ArrowDown size={13} strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}

import clsx from "clsx";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Same name on sibling Disclosures = native exclusive accordion (one open at a time). */
  name?: string;
  id?: string;
  className?: string;
};

/**
 * Native <details>/<summary>: keyboard, find-in-page and print-expand
 * (data-print='expand') come from the platform. Opening plays the global
 * `rise` keyframes (opacity + 6px transform) on the content; closing is
 * instant, as the platform does it. Marked data-motion so the reduced
 * motion rule in globals.css stills it. Server-safe.
 */
export function Disclosure({ title, children, defaultOpen, name, id, className }: Props) {
  return (
    <details
      id={id}
      name={name}
      open={defaultOpen}
      className={clsx("group/d border-b border-rule", className)}
      data-motion
    >
      <summary
        className={clsx(
          "flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium text-ink",
          "rounded-sm transition-colors hover:text-ink-2 [&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="min-w-0 flex-1">{title}</span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className="shrink-0 text-ink-3 transition-transform duration-(--dur-2) ease-(--ease-standard) group-open/d:rotate-180 motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
          aria-hidden
        />
      </summary>
      <div className="pb-4 text-sm leading-relaxed text-ink-2 group-open/d:animate-[rise_260ms_cubic-bezier(0.2,0.7,0.2,1)_both] motion-reduce:animate-none [html[data-motion=reduced]_&]:animate-none">
        {children}
      </div>
    </details>
  );
}

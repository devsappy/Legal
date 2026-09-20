import clsx from "clsx";
import type { ReactNode } from "react";

type CardProps = {
  /** Adds shadow-raised for cards that float over the shell. */
  raised?: boolean;
  /** Inner padding on by default; turn off for tables and lists that run edge to edge. */
  padded?: boolean;
  as?: "div" | "section" | "article" | "li";
  className?: string;
  children: ReactNode;
};

/** The rounded-lg sheet surface. Server-safe. */
export function Card({ raised, padded = true, as: Tag = "div", className, children }: CardProps) {
  return (
    <Tag
      className={clsx(
        "rounded-lg border border-rule bg-sheet text-ink",
        padded && "p-4 sm:p-5",
        raised && "shadow-raised",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

type HeaderProps = {
  title: string;
  description?: string;
  /** Right-aligned controls; wrap under the title on phones. */
  actions?: ReactNode;
  /** Heading level for the title; h3 sits under a PageHeader's h1 + section h2s. */
  as?: "h2" | "h3" | "div";
  className?: string;
};

export function CardHeader({ title, description, actions, as: Tag = "h3", className }: HeaderProps) {
  return (
    <div className={clsx("mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2", className)}>
      <div className="min-w-0 flex-1">
        <Tag className="text-base font-medium text-ink">{title}</Tag>
        {description && <p className="mt-1 max-w-[60ch] text-sm text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

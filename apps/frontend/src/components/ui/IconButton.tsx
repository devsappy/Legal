"use client";

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { buttonClasses } from "./Button";
import { Tooltip } from "@/components/ui/Tooltip";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** Forwarded to the <button>. */
  ref?: Ref<HTMLButtonElement>;
  /** Accessible name; also the tooltip text. */
  label: string;
  /** h-8 w-8 or h-9 w-9. */
  size?: "sm" | "md";
  variant?: "ghost" | "outline";
  /** Set false when the parent already explains the control (e.g. inside a labelled row). */
  tooltip?: boolean;
  className?: string;
  /** The icon, 14–16px, decorative. */
  children: ReactNode;
};

/**
 * An icon-only control that is never unlabelled: the label becomes the
 * aria-label and, by default, a Tooltip. Tooltip clones the button to
 * attach its hover/focus handlers, so the button must be a plain element.
 */
export function IconButton({
  label,
  size = "md",
  variant = "ghost",
  tooltip = true,
  className,
  children,
  type = "button",
  ...rest
}: Props) {
  const button = (
    <button
      type={type}
      aria-label={label}
      {...rest}
      className={buttonClasses(variant, size === "sm" ? "icon-sm" : "icon", className)}
    >
      {children}
    </button>
  );
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
}

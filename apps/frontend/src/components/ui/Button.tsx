import clsx from "clsx";
import type { ButtonHTMLAttributes, Ref } from "react";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "outline" | "ghost" | "soft" | "destructive" | "link";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon" | "icon-sm";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Forwarded to the <button> (React 19 ref-as-prop): initialFocusRef targets, popover triggers. */
  ref?: Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Shows a spinner over the content. The content stays in the layout
   * (transparent) so the button keeps its width; aria-busy is set and the
   * button is disabled until loading ends.
   */
  loading?: boolean;
};

const BASE =
  "relative inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap select-none " +
  "transition-colors active:translate-y-px " +
  "disabled:cursor-not-allowed disabled:not-data-loading:opacity-45 disabled:active:translate-y-0 data-loading:cursor-wait";

const SIZES: Record<ButtonSize, string> = {
  xs: "h-7 px-2 gap-1 text-xs",
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-10 px-4 text-base",
  icon: "h-9 w-9",
  "icon-sm": "h-8 w-8",
};

/* Monochrome only: the destructive variant is a seal outline, never a red fill. */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-raised hover:bg-primary/90",
  outline: "border border-rule bg-sheet text-ink hover:border-rule-strong hover:bg-muted",
  ghost: "text-ink-2 hover:bg-muted hover:text-ink",
  soft: "bg-muted text-ink hover:bg-secondary",
  destructive: "border border-seal/40 bg-sheet text-seal hover:bg-seal-soft",
  link: "h-auto rounded-sm px-0 text-ink underline-offset-4 hover:underline",
};

/** The same classes for anything that is not a <button>, e.g. a next-intl <Link>. */
export function buttonClasses(variant: ButtonVariant = "outline", size: ButtonSize = "md", className?: string) {
  return clsx(BASE, variant !== "link" && SIZES[size], VARIANTS[variant], className);
}

export function Button({
  variant = "outline",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  const small = size === "xs" || size === "sm" || size === "icon-sm";
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading ? "" : undefined}
      className={buttonClasses(variant, size, className)}
    >
      {loading ? (
        <>
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <Spinner size={small ? 13 : 15} />
          </span>
          <span className="inline-flex items-center gap-1.5 opacity-0">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

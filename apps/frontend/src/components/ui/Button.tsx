import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "icon";
};

export function Button({ variant = "outline", size = "md", className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed select-none",
        size === "sm" && "h-7 px-2.5 text-[12.5px]",
        size === "md" && "h-9 px-3.5 text-sm",
        size === "icon" && "h-9 w-9",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_1px_2px_rgba(9,9,11,0.08)]",
        variant === "outline" && "border border-rule bg-sheet text-ink hover:bg-muted",
        variant === "ghost" && "text-ink-2 hover:text-ink hover:bg-muted",
        className,
      )}
    />
  );
}

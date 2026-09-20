import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  options: { value: string; label: string }[];
  /** Leading glyph, rendered inside the pill. */
  icon?: ReactNode;
  size?: "sm" | "md";
};

export function Select({ options, icon, size = "sm", className, ...rest }: Props) {
  return (
    <span className={clsx("select-pill relative inline-flex", className)}>
      {icon && (
        <span
          className={clsx("pointer-events-none absolute top-1/2 -translate-y-1/2 text-brand flex", size === "sm" ? "left-2.5" : "left-3")}
          aria-hidden
        >
          {icon}
        </span>
      )}
      <select
        {...rest}
        className={clsx(
          "appearance-none pr-7 rounded-full bg-sheet border border-rule font-medium text-ink hover:bg-muted transition-colors cursor-pointer truncate w-full",
          size === "sm" ? "h-8 text-[13px]" : "h-9 text-[13.5px] pr-8",
          icon ? (size === "sm" ? "pl-8" : "pl-9") : size === "sm" ? "pl-3" : "pl-4",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3"
        aria-hidden
      />
    </span>
  );
}

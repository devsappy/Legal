import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
  /** Leading glyph, rendered inside the pill. */
  icon?: ReactNode;
};

export function Select({ options, icon, className, ...rest }: Props) {
  return (
    <span className={clsx("relative inline-flex", className)}>
      {icon && (
        <span
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-violet flex"
          aria-hidden
        >
          {icon}
        </span>
      )}
      <select
        {...rest}
        className={clsx(
          "appearance-none h-8 pr-7 rounded-full bg-sheet border border-rule text-[13px] font-medium text-ink hover:bg-muted transition-colors cursor-pointer truncate w-full",
          icon ? "pl-8" : "pl-3",
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

import clsx from "clsx";
import type { Ref, TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Forwarded to the <textarea>. */
  ref?: Ref<HTMLTextAreaElement>;
  /** Seal border + aria-invalid. */
  invalid?: boolean;
};

/** Multi-line sibling of Input: same border, radius and focus treatment. Server-safe. */
export function Textarea({ invalid, className, rows = 4, ...rest }: Props) {
  return (
    <textarea
      rows={rows}
      {...rest}
      aria-invalid={invalid || rest["aria-invalid"] || undefined}
      className={clsx(
        "block w-full min-w-0 resize-y rounded-lg border bg-sheet px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-3 outline-none transition-colors",
        "hover:border-rule-strong focus:border-brand/60 disabled:cursor-not-allowed disabled:opacity-45",
        invalid ? "border-seal/60 hover:border-seal/60" : "border-rule",
        className,
      )}
    />
  );
}

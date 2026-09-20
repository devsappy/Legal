import clsx from "clsx";

type Props = {
  /** Diameter in px. */
  size?: number;
  /**
   * Accessible label. When given the spinner is announced as a status
   * region; without it the glyph is decorative and hidden from readers.
   */
  label?: string;
  className?: string;
};

/**
 * A currentColor ring so it inherits the button or text colour it sits in.
 * Under reduced motion (OS setting or <html data-motion="reduced">) the
 * spinning ring is swapped for a static three-dot glyph.
 */
export function Spinner({ size = 14, label, className }: Props) {
  const ring = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin motion-reduce:hidden [html[data-motion=reduced]_&]:hidden"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
  const dots = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="hidden motion-reduce:block [html[data-motion=reduced]_&]:block"
      aria-hidden
    >
      <circle cx="5" cy="12" r="2.5" />
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="19" cy="12" r="2.5" />
    </svg>
  );
  return (
    <span
      className={clsx("inline-flex shrink-0 items-center justify-center", className)}
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      style={{ width: size, height: size }}
    >
      {ring}
      {dots}
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

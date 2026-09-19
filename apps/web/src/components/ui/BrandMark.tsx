import { Scale } from "lucide-react";
import clsx from "clsx";

/** The brand scale tile used in the sidebar, landing header and sign-in card. */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      className={clsx(
        "shrink-0 rounded-lg bg-brand text-primary-foreground flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Scale size={Math.round(size * 0.54)} strokeWidth={2.25} />
    </span>
  );
}

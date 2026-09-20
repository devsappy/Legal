import { getTranslations } from "next-intl/server";
import clsx from "clsx";
import { JURISDICTIONS } from "@sahayak/shared";
import { Link } from "@/i18n/navigation";

const TILE =
  "group flex shrink-0 flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted";

/** `track` fixes the width for the marquee; `copy` marks the duplicate decorative and unfocusable. */
function Wordmarks({ track, copy }: { track?: boolean; copy?: boolean }) {
  return (
    <>
      {JURISDICTIONS.map((j) => (
        <Link
          key={j.id}
          href="/#acts"
          className={clsx(TILE, track ? "w-[220px]" : "min-w-0")}
          tabIndex={copy ? -1 : undefined}
          aria-hidden={copy || undefined}
        >
          <span className="font-mono text-xs font-semibold tracking-wide text-ink">{j.short}</span>
          <span className="truncate text-xs text-ink-3 transition-colors group-hover:text-ink-2">{j.act}</span>
        </Link>
      ))}
    </>
  );
}

/**
 * Trust strip under the hero: the six Acts as wordmark tiles, each a link
 * to the Acts section. A static row from lg up; below that the row scrolls
 * as a marquee (the second copy is decorative and unfocusable), pausing
 * under the pointer or keyboard focus and stilled by reduced motion.
 */
export async function ActsStrip() {
  const t = await getTranslations("landing.actsStrip");
  return (
    <section id="acts-strip" aria-label={t("label")} className="scroll-mt-[80px] border-y border-rule-strong bg-paper">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:gap-6">
        <p className="shrink-0 font-mono text-2xs font-semibold uppercase tracking-[0.14em] text-ink-3">{t("label")}</p>
        <div className="hidden min-w-0 flex-1 grid-cols-6 gap-1 lg:grid">
          <Wordmarks />
        </div>
        {/* Stilled by reduced motion, the row scrolls by hand instead. */}
        <div className="scroll-thin -mx-4 overflow-hidden motion-reduce:overflow-x-auto sm:-mx-8 lg:hidden [html[data-motion=reduced]_&]:overflow-x-auto">
          {/* Two identical halves, so the -50% loop lands exactly on the seam. */}
          <div className="marquee-track" data-motion>
            <div className="flex gap-1 pr-1">
              <Wordmarks track />
            </div>
            <div className="flex gap-1 pr-1">
              <Wordmarks track copy />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

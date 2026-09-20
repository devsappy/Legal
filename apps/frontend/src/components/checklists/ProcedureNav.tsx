"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { Link, useRouter } from "@/i18n/navigation";
import { useHotkey } from "@/hooks/useHotkey";
import { Kbd } from "@/components/ui/Kbd";

export type Neighbour = { slug: string; title: string };

type Props = {
  prev?: Neighbour;
  next?: Neighbour;
  className?: string;
};

/**
 * Previous / next procedure under the same Act, with ← / → bound while the
 * page is open (global scope, so they show in the shortcuts sheet).
 */
export function ProcedureNav({ prev, next, className }: Props) {
  const t = useTranslations("checklists");
  const router = useRouter();

  useHotkey("arrowleft", () => prev && router.push(`/checklists/${prev.slug}`), {
    id: "checklists.prev",
    scope: "global",
    label: t("previous"),
    enabled: !!prev,
  });
  useHotkey("arrowright", () => next && router.push(`/checklists/${next.slug}`), {
    id: "checklists.next",
    scope: "global",
    label: t("next"),
    enabled: !!next,
  });

  if (!prev && !next) return null;

  const item = (n: Neighbour | undefined, dir: "prev" | "next") => {
    if (!n) return <span aria-hidden />;
    const isPrev = dir === "prev";
    return (
      <Link
        href={`/checklists/${n.slug}`}
        className={clsx(
          "group flex min-w-0 flex-col gap-1 rounded-lg border border-rule bg-sheet px-4 py-3 transition-colors hover:border-rule-strong hover:bg-muted/40",
          isPrev ? "items-start text-left" : "items-end text-right",
        )}
        rel={isPrev ? "prev" : "next"}
      >
        <span className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-[0.08em] text-ink-3">
          {isPrev && <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" aria-hidden />}
          {isPrev ? t("previous") : t("next")}
          {!isPrev && <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden />}
          <Kbd combo={isPrev ? "arrowleft" : "arrowright"} className="max-sm:hidden" />
        </span>
        <span className="line-clamp-2 text-sm font-medium text-ink">{n.title}</span>
      </Link>
    );
  };

  return (
    <nav aria-label={t("navLabel")} className={clsx("grid gap-3 sm:grid-cols-2", className)} data-print="hide">
      {item(prev, "prev")}
      {item(next, "next")}
    </nav>
  );
}

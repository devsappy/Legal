"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { pick } from "@sahayak/shared";
import { Link } from "@/i18n/navigation";
import { Badge, type BadgeKind } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { CHANGELOG, type ChangelogTag } from "@/content/changelog";
import { formatDate } from "@/lib/format";
import { useHelp } from "./HelpProvider";

const TAG_KIND: Record<ChangelogTag, BadgeKind> = { new: "solid", improved: "neutral", fixed: "soft" };

/**
 * The changelog as a right-hand sheet. Opening it (through useHelp) marks
 * the latest entry as seen, which clears the unread dot on the help button.
 */
export function WhatsNew() {
  const t = useTranslations("ui.changelog");
  const h = useTranslations("help.whatsNew");
  const locale = useLocale();
  const { whatsNewOpen, closeWhatsNew } = useHelp();

  return (
    <Drawer
      open={whatsNewOpen}
      onOpenChange={(o) => {
        if (!o) closeWhatsNew();
      }}
      side="right"
      width="min(92vw,420px)"
      title={t("title")}
      description={h("description")}
      footer={
        <Link
          href="/changelog"
          className="inline-flex items-center gap-1.5 text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline"
        >
          {h("all")}
          <ArrowRight size={12} aria-hidden />
        </Link>
      }
    >
      <ol className="relative ml-2 border-l border-rule">
        {CHANGELOG.map((entry) => (
          <li key={entry.id} className="relative pb-6 pl-5 last:pb-0">
            <span aria-hidden className="absolute -left-[5px] top-1.5 size-2 rounded-full border border-ink bg-sheet" />
            <div className="flex flex-wrap items-center gap-2">
              <time dateTime={entry.date} className="font-mono text-2xs text-ink-3">
                {formatDate(entry.date, locale)}
              </time>
              <Badge kind={TAG_KIND[entry.tag]}>{t(entry.tag)}</Badge>
            </div>
            <h3 className="mt-1.5 text-sm font-medium text-ink">{pick(entry.title, locale)}</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-2">{pick(entry.body, locale)}</p>
          </li>
        ))}
      </ol>
    </Drawer>
  );
}

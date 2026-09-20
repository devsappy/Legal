import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pick } from "@sahayak/shared";
import { CHANGELOG } from "@/content/changelog";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

/**
 * The newest changelog entry, so the dashboard says what changed without
 * a drawer. Server-safe: the copy comes from content/changelog.ts.
 */
export function WhatsNewCard({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const tc = useTranslations("ui.changelog");
  const entry = CHANGELOG[0];
  if (!entry) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-medium text-ink">
          <Sparkles size={15} strokeWidth={1.75} className="text-ink-3" aria-hidden />
          {t("whatsNew")}
        </h2>
        <time dateTime={entry.date} className="shrink-0 font-mono text-2xs text-ink-3">
          {formatDate(entry.date, locale)}
        </time>
      </div>
      <article className="mt-3 flex flex-1 flex-col">
        <Badge kind={entry.tag === "new" ? "solid" : "neutral"} className="w-fit">
          {tc(entry.tag)}
        </Badge>
        <h3 className="mt-2.5 text-sm font-medium text-ink">{pick(entry.title, locale)}</h3>
        <p className="mt-1 line-clamp-4 text-sm text-ink-2">{pick(entry.body, locale)}</p>
      </article>
      <Link
        href="/changelog"
        className="mt-3 inline-flex w-fit items-center gap-1 rounded-sm text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline"
      >
        {t("viewAll")}
        <ArrowRight size={12} aria-hidden />
      </Link>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BrandMark, buttonClasses } from "@/components/ui";
import { Skyline } from "@/components/landing/Skyline";

/**
 * The localised 404 inside the locale layout (fonts, theme and providers
 * apply). Reached through [...rest]/page.tsx for unknown paths and through
 * notFound() in any page, e.g. a checklist with a bad slug.
 */
export default async function NotFound() {
  const t = await getTranslations();

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-paper">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 sm:px-8">
        <div className="flex h-16 items-center">
          <Link href="/" className="inline-flex items-center gap-3 text-base font-medium text-ink">
            <BrandMark size={30} />
            <span>{t("app.name")}</span>
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center py-12 sm:py-16">
          <p className="font-mono text-[clamp(72px,14vw,150px)] font-medium leading-none tracking-[-0.04em] text-rule-strong select-none" aria-hidden>
            404
          </p>
          <h1 className="mt-4 text-2xl font-medium text-ink">{t("errors.notFoundTitle")}</h1>
          <p className="mt-2 max-w-[44ch] text-base text-ink-2">{t("errors.notFoundBody")}</p>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Link href="/" className={buttonClasses("primary", "lg", "group")}>
              {t("errors.home")}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
                aria-hidden
              />
            </Link>
            <Link href="/ask" className={buttonClasses("outline", "lg")}>
              <MessageSquareText size={16} strokeWidth={1.75} aria-hidden />
              {t("errors.goToAsk")}
            </Link>
          </div>
        </div>
      </div>

      <Skyline className="skyline pointer-events-none w-[max(100%,1200px)] max-w-none h-auto self-center shrink-0 -mb-px text-rule-strong" />
    </main>
  );
}

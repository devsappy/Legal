import { getTranslations } from "next-intl/server";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { Reveal } from "@/components/landing/Reveal";
import { Skyline } from "@/components/landing/Skyline";
import { ProductPreview } from "@/components/landing/ProductPreview";

const KICKER = "text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3";

/**
 * Claim on the left, the product on the right, the line-art streetscape
 * pinned edge to edge beneath both. The text is rendered visible on the
 * server (Reveal eager) so it is the LCP element and reads without
 * JavaScript; the preview is a client island that plays once in view.
 */
export async function Hero() {
  const t = await getTranslations("landing");
  return (
    <section id="product" className="relative flex w-full scroll-mt-[80px] flex-col overflow-hidden">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-10 px-4 pb-10 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pb-14 lg:pt-20">
        <div className="max-w-[600px]">
          <Reveal eager>
            <p className={KICKER}>{t("eyebrow")}</p>
          </Reveal>
          <Reveal eager delay={80}>
            <h1 className="mt-4 text-balance text-[clamp(32px,4vw,52px)] font-semibold leading-[1.06] tracking-[-0.03em] text-ink">
              {t("title")}
            </h1>
          </Reveal>
          <Reveal eager delay={160}>
            <p className="mt-5 max-w-[46ch] text-pretty text-base leading-[1.55] text-ink-2 sm:text-lg">{t("subtitle")}</p>
          </Reveal>
          <Reveal eager delay={240}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className={buttonClasses("primary", "lg", "group px-5")}>
                {t("hero.createAccount")}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
              </Link>
              <Link href="/login?demo=1" className={buttonClasses("outline", "lg", "px-5")}>
                {t("hero.tryDemo")}
              </Link>
              <Link
                href="#how"
                className="group inline-flex h-10 items-center gap-1 rounded-md px-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
              >
                {t("hero.seeHow")}
                <ArrowDown size={14} className="transition-transform group-hover:translate-y-0.5 motion-reduce:transition-none" aria-hidden />
              </Link>
            </div>
            <p className="mt-3 text-xs text-ink-3">{t("hero.note")}</p>
          </Reveal>
        </div>
        <Reveal eager delay={200} className="min-w-0">
          <ProductPreview />
        </Reveal>
      </div>
      {/* Edge to edge on wide screens; phones keep a minimum width and see the centre of the street */}
      <Skyline className="skyline -mb-px h-auto w-[max(100%,1200px)] max-w-none shrink-0 self-center text-rule-strong" />
    </section>
  );
}

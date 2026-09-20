import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/landing/Reveal";
import { Skyline } from "@/components/landing/Skyline";

const SECTION = "relative mx-auto w-full max-w-[1400px] scroll-mt-[80px] px-4 pb-16 pt-4 sm:px-8 sm:pb-24";

const PRIMARY =
  "group inline-flex h-11 items-center gap-2 rounded-md bg-paper px-5 text-base font-medium text-ink transition-colors hover:bg-paper/90 active:translate-y-px";
const GHOST =
  "inline-flex h-11 items-center rounded-md border border-paper/30 px-5 text-base font-medium text-paper transition-colors hover:bg-paper/10";

/**
 * The closing call to action: ink band, a paper-filled button that stays
 * visible in both themes, a ghost sign-in and a faint streetscape crop.
 */
export async function CtaBand() {
  const t = await getTranslations("landing");
  return (
    <section id="cta" className={SECTION}>
      <Reveal className="relative overflow-hidden rounded-md bg-ink text-paper">
        <Skyline className="pointer-events-none absolute -bottom-6 left-1/2 hidden w-[1400px] -translate-x-1/2 text-paper/15 lg:block" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-10 lg:p-12">
          <div className="min-w-0 flex-1">
            <h2 className="text-[clamp(24px,2.8vw,34px)] font-semibold leading-tight tracking-[-0.03em] text-paper">{t("cta.title")}</h2>
            <p className="mt-2 max-w-[56ch] text-base text-paper/75">{t("cta.body")}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/register" className={PRIMARY}>
              {t("hero.createAccount")}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
            </Link>
            <Link href="/login" className={GHOST}>
              {t("cta.signIn")}
            </Link>
          </div>
        </div>
        <p className="relative border-t border-paper/15 px-6 py-3 text-xs text-paper/70 sm:px-8 lg:px-12">{t("cta.note")}</p>
      </Reveal>
    </section>
  );
}

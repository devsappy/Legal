import { getTranslations } from "next-intl/server";
import { JURISDICTIONS, LANGUAGES, type Locale } from "@sahayak/shared";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { StatusDot } from "./StatusDot";

const HEADING = "text-2xs font-semibold uppercase tracking-[0.12em] text-ink-3";
const LIST = "mt-3 flex flex-col gap-2 text-sm";
const LINK = "inline-flex min-h-6 items-center rounded-sm text-ink-2 transition-colors hover:text-ink";

/**
 * Four columns on lg, two on sm, one on phones, with 16px gutters at the
 * narrowest width. Server-rendered except for the live status dot. The
 * language links go to the home page in each locale (the header's switcher
 * keeps the current page).
 */
export async function PublicFooter() {
  const t = await getTranslations("public");
  const app = await getTranslations("app");
  const legal = await getTranslations("legal");
  const landing = await getTranslations("landing");
  const year = new Date().getFullYear();

  const product = [
    { label: t("menu.ask"), href: "/#ask" },
    { label: t("menu.procedures"), href: "/#procedures" },
    { label: t("nav.pricing"), href: "/#pricing" },
    { label: t("nav.faq"), href: "/#faq" },
    { label: t("nav.whatsNew"), href: "/changelog" },
  ];

  return (
    <footer data-print="hide" className="relative mt-auto border-t border-rule-strong bg-paper">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-8 sm:py-14">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className={HEADING}>{t("footer.product")}</h2>
            <ul className={LIST}>
              {product.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className={LINK}>
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={HEADING}>{t("footer.acts")}</h2>
            <ul className={LIST}>
              {JURISDICTIONS.map((j) => (
                <li key={j.id}>
                  <Link href="/#acts" className={LINK}>
                    <span className="font-mono text-xs">{j.short}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={HEADING}>{t("footer.languages")}</h2>
            <ul className={LIST}>
              {LANGUAGES.map((l) => (
                <li key={l.code}>
                  <Link href="/" locale={l.code as Locale} lang={l.code} className={LINK}>
                    {l.native}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={HEADING}>{t("footer.legal")}</h2>
            <ul className={LIST}>
              <li>
                <Link href="/privacy" className={LINK}>
                  {legal("privacy.title")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={LINK}>
                  {legal("terms.title")}
                </Link>
              </li>
              <li>
                <Link href="/status" className={LINK}>
                  {t("footer.status")}
                </Link>
              </li>
              <li>
                <Link href="/changelog" className={LINK}>
                  {t("footer.changelog")}
                </Link>
              </li>
              <li>
                <a href={`mailto:${landing("pricing.contactEmail")}`} className={LINK}>
                  {t("footer.contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-rule pt-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:gap-6">
          <p className="flex items-center gap-2.5 text-ink-2">
            <BrandMark size={22} />
            <span>{t("footer.rights", { year: String(year), name: app("name") })}</span>
          </p>
          <p className="sm:flex-1">{app("notice")}</p>
          <StatusDot className="self-start sm:self-auto" />
        </div>
      </div>
    </footer>
  );
}

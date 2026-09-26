"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NavMenu } from "./NavMenu";
import { MobileMenu } from "./MobileMenu";

/** Past this many pixels the bar closes up: a touch more ink and a hairline. */
const SCROLL_THRESHOLD = 24;

const NAV_ITEM =
  "inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-md px-3 text-sm font-medium text-paper/85 transition-colors hover:bg-paper/10 hover:text-paper aria-expanded:bg-paper/10 aria-expanded:text-paper";

/* Display is set per link (hidden below lg), so the base carries none. */
const PILL = "h-9 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors";

const NAV_LINKS = [
  { key: "how", href: "/#how" },
  { key: "faq", href: "/#faq" },
  { key: "whatsNew", href: "/changelog" },
] as const;

function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}

/**
 * The marketing site's sticky bar: the translucent ink header the landing
 * page always had, 64px tall, paper text so it flips with the theme. Over
 * the hero it sits a little lighter; after 24px of scroll it closes up
 * with a hairline. Desktop shows the Product menu and page links; below lg
 * everything folds into the MobileMenu drawer.
 */
export function PublicHeader() {
  const t = useTranslations("public");
  const app = useTranslations("app");
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > SCROLL_THRESHOLD, () => false);

  return (
    <header
      data-print="hide"
      data-scrolled={scrolled ? "" : undefined}
      className={clsx(
        "nav-dark sticky top-0 z-(--z-sticky) border-b text-paper backdrop-blur-md transition-colors duration-(--dur-2) ease-standard",
        scrolled ? "border-paper/10 bg-ink/90" : "border-transparent bg-ink/75",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-2 px-4 sm:px-8">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3 rounded-md text-base font-semibold tracking-tight text-paper">
          <BrandMark size={30} className="!bg-paper !text-ink" />
          <span className="hidden truncate sm:inline">{app("name")}</span>
        </Link>

        <nav aria-label={t("nav.label")} className="ml-4 hidden items-center gap-0.5 lg:flex">
          <NavMenu className={NAV_ITEM} />
          {NAV_LINKS.map(({ key, href }) => (
            <Link key={key} href={href} className={NAV_ITEM}>
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="hidden items-center gap-1.5 sm:inline-flex sm:gap-2">
            <ThemeToggle tone="onDark" />
            <LanguageSwitcher size="md" />
          </span>
          <Link href="/login" className={clsx(PILL, "hidden border border-paper/30 text-paper hover:bg-paper/10 lg:inline-flex")}>
            {t("signIn")}
          </Link>
          <Link href="/register" className={clsx(PILL, "hidden bg-paper text-ink hover:bg-paper/90 lg:inline-flex")}>
            {t("createAccount")}
          </Link>
          <MobileMenu className="inline-flex h-9 w-9 items-center justify-center rounded-md text-paper/85 transition-colors hover:bg-paper/10 hover:text-paper lg:hidden" />
        </div>
      </div>
    </header>
  );
}

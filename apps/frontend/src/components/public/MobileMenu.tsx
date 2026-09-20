"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Tooltip } from "@/components/ui/Tooltip";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { PRODUCT_LINKS } from "./NavMenu";

const TOP_LINKS = [
  { key: "how", href: "/#how" },
  { key: "pricing", href: "/#pricing" },
  { key: "faq", href: "/#faq" },
  { key: "whatsNew", href: "/changelog" },
] as const;

const ROW =
  "flex items-center justify-between gap-3 rounded-md px-2 py-2.5 text-base text-ink transition-colors hover:bg-muted";

/**
 * Below lg the header collapses to a hamburger that opens a right-hand
 * Drawer (native <dialog>: focus trapped, Escape closes) with the same
 * links as the desktop nav, the language and theme controls and both calls
 * to action. Every link closes the sheet, including same-page anchors.
 */
export function MobileMenu({ className }: { className?: string }) {
  const t = useTranslations("public");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Tooltip content={t("openMenu")}>
        <button
          type="button"
          aria-label={t("openMenu")}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={className}
        >
          <Menu size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </Tooltip>

      <Drawer open={open} onOpenChange={setOpen} side="right" title={t("menuTitle")} closeLabel={t("closeMenu")}>
        <nav aria-label={t("nav.label")} className="flex flex-col gap-5">
          <div>
            <p className="px-2 pb-1 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{t("nav.product")}</p>
            <ul className="flex flex-col">
              {PRODUCT_LINKS.map(({ key, href, icon: Icon }) => (
                <li key={key}>
                  <Link href={href} onClick={close} className={ROW}>
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-ink-2" aria-hidden />
                      <span className="min-w-0">
                        <span className="block font-medium">{t(`menu.${key}`)}</span>
                        <span className="block text-xs text-ink-3">{t(`menu.${key}Hint`)}</span>
                      </span>
                    </span>
                    <ChevronRight size={14} className="shrink-0 text-ink-3" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <ul className="flex flex-col border-t border-rule pt-3">
            {TOP_LINKS.map(({ key, href }) => (
              <li key={key}>
                <Link href={href} onClick={close} className={ROW}>
                  <span className="font-medium">{t(`nav.${key}`)}</span>
                  <ChevronRight size={14} className="shrink-0 text-ink-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-rule pt-4">
          <LanguageSwitcher size="md" />
          <ThemeToggle />
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Link href="/register" onClick={close} className={buttonClasses("primary", "lg", "w-full")}>
            {t("createAccount")}
          </Link>
          <Link href="/login" onClick={close} className={buttonClasses("outline", "lg", "w-full")}>
            {t("signIn")}
          </Link>
        </div>
      </Drawer>
    </>
  );
}

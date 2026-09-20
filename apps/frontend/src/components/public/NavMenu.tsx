"use client";

import { useTranslations } from "next-intl";
import { BookA, ChevronDown, ListChecks, MessageSquareText, Scale } from "lucide-react";
import { DropdownMenu, MenuItem } from "@/components/ui/DropdownMenu";

/** Where the "Product" menu takes people: anchors on the landing page. */
export const PRODUCT_LINKS = [
  { key: "ask", href: "/#ask", icon: MessageSquareText },
  { key: "procedures", href: "/#procedures", icon: ListChecks },
  { key: "glossary", href: "/#glossary", icon: BookA },
  { key: "acts", href: "/#acts", icon: Scale },
] as const;

/**
 * The header's "Product" menu, on the DropdownMenu primitive: ArrowDown or
 * Enter opens, arrows move, Escape closes and returns focus. Items are
 * next-intl links to landing-page anchors, so they work from every public
 * page (login, changelog, status), not only the landing.
 */
export function NavMenu({ className }: { className?: string }) {
  const t = useTranslations("public");
  return (
    <DropdownMenu
      align="start"
      className="min-w-[240px]"
      trigger={
        <button type="button" className={className}>
          {t("nav.product")}
          <ChevronDown size={14} strokeWidth={2} className="opacity-70" aria-hidden />
        </button>
      }
    >
      {PRODUCT_LINKS.map(({ key, href, icon: Icon }) => (
        <MenuItem key={key} href={href} icon={<Icon size={15} strokeWidth={1.75} />}>
          <span className="block whitespace-normal">
            <span className="block font-medium text-ink">{t(`menu.${key}`)}</span>
            <span className="block text-xs text-ink-3">{t(`menu.${key}Hint`)}</span>
          </span>
        </MenuItem>
      ))}
    </DropdownMenu>
  );
}

"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  { href: "/admin/documents", key: "documents" },
  { href: "/admin/glossary", key: "glossary" },
  { href: "/admin/queries", key: "queries" },
] as const;

export function AdminNav() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <nav aria-label={t("title")} className="flex gap-1 border-b border-rule -mb-px overflow-x-auto scroll-thin -mx-4 px-4 sm:mx-0 sm:px-0">
      {ITEMS.map((i) => {
        const active = pathname.startsWith(i.href);
        return (
          <Link
            key={i.key}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "px-3 py-2 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap",
              active
                ? "border-violet text-ink font-medium"
                : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {t(i.key)}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Database, SlidersHorizontal, UserRound } from "lucide-react";
import clsx from "clsx";
import { Link, usePathname } from "@/i18n/navigation";
import { Tabs } from "@/components/ui/Tabs";

const ITEMS = [
  { value: "profile", href: "/settings", icon: UserRound, exact: true },
  { value: "preferences", href: "/settings/preferences", icon: SlidersHorizontal, exact: false },
  { value: "data", href: "/settings/data", icon: Database, exact: false },
] as const;

type Props = {
  /** Horizontal route tabs (phones and tablets) or the vertical list (lg+). */
  variant: "tabs" | "list";
  className?: string;
};

/**
 * The three settings sections. Both variants are route links with
 * aria-current; the active one is worked out here because "/settings" is
 * a prefix of the other two and must only match exactly.
 */
export function SettingsNav({ variant, className }: Props) {
  const t = useTranslations("settings");
  const pathname: string = usePathname() ?? "";
  const active =
    ITEMS.find((it) => (it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`)))?.value ??
    "profile";

  if (variant === "tabs") {
    return (
      <Tabs
        ariaLabel={t("title")}
        value={active}
        items={ITEMS.map((it) => ({
          value: it.value,
          label: t(`nav.${it.value}`),
          href: it.href,
          icon: <it.icon size={15} strokeWidth={1.75} />,
        }))}
        className={className}
      />
    );
  }

  return (
    <nav aria-label={t("title")} className={className}>
      <ul className="flex flex-col gap-0.5">
        {ITEMS.map((it) => {
          const current = it.value === active;
          const Icon = it.icon;
          return (
            <li key={it.value}>
              <Link
                href={it.href}
                aria-current={current ? "page" : undefined}
                className={clsx(
                  "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                  current ? "bg-muted font-medium text-ink" : "text-ink-2 hover:bg-muted/60 hover:text-ink",
                )}
              >
                <Icon size={15} strokeWidth={current ? 2 : 1.75} aria-hidden />
                {t(`nav.${it.value}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

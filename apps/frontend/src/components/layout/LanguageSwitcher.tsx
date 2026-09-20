"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LANGUAGES } from "@/lib/config";
import type { Locale } from "@/i18n/routing";
import { Select } from "@/components/ui/Select";

export function LanguageSwitcher({ size }: { size?: "sm" | "md" }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const change = (next: string) => {
    router.replace(pathname, { locale: next as Locale });
  };
  const options = LANGUAGES.map((l) => ({ value: l.code, label: l.native }));

  return (
    <Select
      aria-label={t("language")}
      value={locale}
      onChange={(e) => change(e.target.value)}
      options={options}
      icon={<Languages size={size === "md" ? 16 : 14} strokeWidth={2} />}
      size={size}
    />
  );
}

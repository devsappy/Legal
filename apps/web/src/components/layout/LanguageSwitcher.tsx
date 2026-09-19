"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LANGUAGES } from "@/lib/config";
import type { Locale } from "@/i18n/routing";
import { Select } from "@/components/ui/Select";

type Props = {
  /** `card` is the sidebar footer tile; `pill` is the compact control. */
  variant?: "pill" | "card";
};

export function LanguageSwitcher({ variant = "pill" }: Props) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const change = (next: string) => {
    router.replace(pathname, { locale: next as Locale });
  };
  const options = LANGUAGES.map((l) => ({ value: l.code, label: l.native }));

  if (variant === "pill") {
    return (
      <Select
        aria-label={t("language")}
        value={locale}
        onChange={(e) => change(e.target.value)}
        options={options}
        icon={<Languages size={14} strokeWidth={2} />}
      />
    );
  }

  const current = LANGUAGES.find((l) => l.code === locale);
  return (
    <label className="relative flex items-center gap-2.5 rounded-xl border border-rule bg-sheet p-2 pr-3 cursor-pointer hover:border-rule-strong transition-colors focus-within:border-violet/60">
      <span className="h-9 w-9 shrink-0 rounded-full bg-violet-soft text-violet flex items-center justify-center">
        <Languages size={16} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[13px] font-medium text-ink truncate">{current?.native}</span>
        <span className="block text-[11px] text-ink-3">{t("language")}</span>
      </span>
      <ChevronDown size={14} className="text-ink-3 shrink-0" aria-hidden />
      <select
        aria-label={t("language")}
        value={locale}
        onChange={(e) => change(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

import { defineRouting } from "next-intl/routing";
import { LOCALES } from "@sahayak/shared";

export const locales = LOCALES;
export type { Locale } from "@sahayak/shared";

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});

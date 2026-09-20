import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { PUBLIC_PATHS } from "@/lib/routes";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Every public path in every locale, each entry carrying the hreflang alternates for the others. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const url = (locale: string, path: string) => `${SITE_URL}/${locale}${path === "/" ? "" : path}`;

  return PUBLIC_PATHS.flatMap((path) => {
    const languages = Object.fromEntries(routing.locales.map((l) => [l, url(l, path)]));
    languages["x-default"] = url(routing.defaultLocale, path);
    return routing.locales.map((locale) => ({
      url: url(locale, path),
      lastModified,
      changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "/" ? 1 : 0.6,
      alternates: { languages },
    }));
  });
}

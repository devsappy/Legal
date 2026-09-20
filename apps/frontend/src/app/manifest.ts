import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * Web app manifest. Served from the root, so it uses the default locale's
 * name and tagline; the colours are the light theme's ink and paper.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "app" });
  return {
    name: t("name"),
    short_name: t("name"),
    description: t("tagline"),
    start_url: `/${routing.defaultLocale}`,
    display: "standalone",
    theme_color: "#09090b",
    background_color: "#ffffff",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

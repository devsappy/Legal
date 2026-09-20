import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { PRIVATE_PREFIXES } from "@/lib/routes";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Public pages may be indexed; the API and everything behind sign-in may not, in any locale. */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", ...routing.locales.flatMap((l) => PRIVATE_PREFIXES.map((p) => `/${l}${p}`))];
  return {
    rules: { userAgent: "*", allow: "/", disallow },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

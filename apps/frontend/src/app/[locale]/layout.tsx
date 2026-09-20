import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { JurisdictionProvider } from "@/components/layout/JurisdictionProvider";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { Toaster } from "@/components/ui/Toast";
import "../globals.css";

/** Public origin for absolute URLs in metadata (Open Graph, alternates, sitemap). */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Open Graph wants a region-qualified locale. */
const OG_LOCALE: Record<string, string> = { en: "en_IN", hi: "hi_IN", mr: "mr_IN", ta: "ta_IN" };

/**
 * Restores per-device choices before the first paint so nothing flashes:
 * coop.theme === "dark" -> <html data-theme="dark"> (light is the default and
 * the OS colour scheme is ignored); coop.prefs.reduceMotion -> data-motion.
 */
const PRE_PAINT = `try{var d=document.documentElement;if(localStorage.getItem("coop.theme")==="dark")d.dataset.theme="dark";var p=JSON.parse(localStorage.getItem("coop.prefs")||"null");if(p&&p.reduceMotion)d.dataset.motion="reduced"}catch(e){}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export function generateViewport(): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    // applyTheme() swaps this for the dark --paper when the theme toggles.
    themeColor: "#ffffff",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `/${l}`]));
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
    applicationName: t("name"),
    alternates: {
      languages: { ...languages, "x-default": `/${routing.defaultLocale}` },
    },
    openGraph: {
      siteName: t("name"),
      title: t("name"),
      description: t("tagline"),
      locale: OG_LOCALE[locale] ?? locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("name"),
      description: t("tagline"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
      </head>
      <body className="min-h-dvh flex flex-col bg-shell">
        <NextIntlClientProvider>
          <JurisdictionProvider>
            {/* Both read their button copy from the `ui` namespace on the client. */}
            <ConfirmProvider>
              {children}
              <Toaster />
            </ConfirmProvider>
          </JurisdictionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

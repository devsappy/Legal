import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { AppShell } from "@/components/layout/AppShell";
import { JurisdictionProvider } from "@/components/layout/JurisdictionProvider";
import { ChatProvider } from "@/components/chat/ChatProvider";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
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
      <body className="h-dvh flex flex-col overflow-hidden bg-shell">
        <NextIntlClientProvider>
          <JurisdictionProvider>
            <ChatProvider>
              <AppShell>{children}</AppShell>
            </ChatProvider>
          </JurisdictionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

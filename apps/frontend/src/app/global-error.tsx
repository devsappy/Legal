"use client";

import { useEffect } from "react";
import Link from "next/link";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { RotateCw, TriangleAlert } from "lucide-react";
import en from "../../messages/en.json";
import { fontVariables } from "@/lib/fonts";
import { BrandMark, Button, buttonClasses } from "@/components/ui";
import "./globals.css";

type Props = { error: Error & { digest?: string }; reset: () => void };

/** Only the two namespaces this screen reads; the request locale is unknown once the layout has failed. */
const MESSAGES = { app: en.app, errors: en.errors };

function Screen({ error, reset }: Props) {
  const t = useTranslations("errors");
  const app = useTranslations("app");
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 sm:px-8">
        <div className="flex h-16 items-center">
          <Link href="/" className="inline-flex items-center gap-3 text-base font-medium text-ink">
            <BrandMark size={30} />
            <span>{app("name")}</span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center sm:py-16">
          <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-seal" aria-hidden>
            <TriangleAlert size={22} strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 text-2xl font-medium text-ink">{t("title")}</h1>
          <p className="mt-2 max-w-[44ch] text-base text-ink-2">{t("body")}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="primary" size="lg" onClick={reset}>
              <RotateCw size={16} strokeWidth={2} aria-hidden />
              {t("retry")}
            </Button>
            <Link href="/" className={buttonClasses("outline", "lg")}>
              {t("home")}
            </Link>
          </div>
          {error.digest && <p className="mt-8 font-mono text-xs text-ink-3">{t("digest", { digest: error.digest })}</p>}
        </div>
      </div>
    </main>
  );
}

/**
 * Last-resort boundary: it replaces the root layout, so it renders its own
 * <html> and <body>, loads the fonts and tokens itself, and mounts a
 * minimal intl provider with the English copy. Links are plain next/link
 * anchors to "/" because the locale router is not mounted here.
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col bg-paper text-ink">
        <NextIntlClientProvider locale="en" messages={MESSAGES}>
          <Screen error={error} reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BrandMark, Button, buttonClasses } from "@/components/ui";

/**
 * Error boundary for every page under the locale layout (the layout
 * itself is covered by global-error.tsx). Localised, since the intl
 * provider from the layout is still mounted; "Try again" re-renders the
 * segment through reset().
 */
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Surfaces the stack in the console; nothing else sees it.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col bg-paper">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 sm:px-8">
        <div className="flex h-16 items-center">
          <Link href="/" className="inline-flex items-center gap-3 text-base font-medium text-ink">
            <BrandMark size={30} />
            <span className="sr-only">{t("home")}</span>
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center sm:py-16">
          <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-seal" aria-hidden>
            <TriangleAlert size={22} strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 text-2xl font-medium text-ink">{t("title")}</h1>
          <p className="mt-2 max-w-[44ch] text-base text-ink-2">{t("body")}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="primary" size="lg" onClick={reset} autoFocus>
              <RotateCw size={16} strokeWidth={2} aria-hidden />
              {t("retry")}
            </Button>
            <Link href="/" className={buttonClasses("outline", "lg")}>
              {t("home")}
            </Link>
          </div>
          {error.digest && (
            <p className="mt-8 font-mono text-xs text-ink-3" lang="en">
              {t("digest", { digest: error.digest })}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

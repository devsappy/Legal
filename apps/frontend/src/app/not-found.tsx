import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { LANGUAGES } from "@sahayak/shared";
import { fontVariables } from "@/lib/fonts";
import { BrandMark } from "@/components/ui";
import "./globals.css";

/**
 * The 404 for paths outside every locale (the locale layout has its own
 * localised one). There is no locale to speak, so the copy is English and
 * the page offers the four language homes, each in its own script.
 */
export default async function RootNotFound() {
  const t = await getTranslations({ locale: "en", namespace: "errors" });
  const app = await getTranslations({ locale: "en", namespace: "app" });
  const nav = await getTranslations({ locale: "en", namespace: "nav" });

  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col bg-paper text-ink">
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 sm:px-8">
          <div className="flex h-16 items-center gap-3 text-base font-medium text-ink">
            <BrandMark size={30} />
            <span>{app("name")}</span>
          </div>

          <div className="flex flex-1 flex-col justify-center py-12 sm:py-16">
            <p className="font-mono text-[clamp(72px,14vw,150px)] font-medium leading-none tracking-[-0.04em] text-rule-strong select-none" aria-hidden>
              404
            </p>
            <h1 className="mt-4 text-2xl font-medium text-ink">{t("notFoundTitle")}</h1>
            <p className="mt-2 max-w-[44ch] text-base text-ink-2">{t("notFoundBody")}</p>

            <p className="mt-8 font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{nav("language")}</p>
            <ul className="mt-3 grid max-w-[640px] gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong sm:grid-cols-2">
              {LANGUAGES.map((l) => (
                <li key={l.code}>
                  <Link
                    href={`/${l.code}`}
                    lang={l.code}
                    hrefLang={l.code}
                    className="tile group flex items-center justify-between gap-3 px-4 py-3.5 text-ink"
                  >
                    <span className="flex items-baseline gap-2.5">
                      <span className="font-mono text-2xs uppercase text-ink-3">{l.code}</span>
                      <span className="text-base font-medium">{l.native}</span>
                    </span>
                    <ArrowRight size={15} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </body>
    </html>
  );
}

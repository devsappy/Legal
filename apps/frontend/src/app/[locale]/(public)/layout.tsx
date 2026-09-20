import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

/**
 * The marketing site's shell: landing, sign-in, legal, changelog and status
 * share one sticky header, one <main id="main"> and one footer. Pages
 * render only their content; the (app) tree behind sign-in has its own shell.
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public");

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-paper text-ink">
      <a
        href="#main"
        className="fixed left-4 top-4 z-(--z-skip) -translate-y-[calc(100%+1.5rem)] rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper shadow-popover transition-transform focus:translate-y-0 motion-reduce:transition-none"
      >
        {t("skip")}
      </a>
      <PublicHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}

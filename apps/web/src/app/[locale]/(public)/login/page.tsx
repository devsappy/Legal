import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { DEMO_ACCOUNT, getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandMark } from "@/components/ui/BrandMark";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: t("title") };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getSessionUser()) redirect({ href: "/ask", locale });

  const t = await getTranslations();

  return (
    <main className="flex-1 flex flex-col bg-paper landing-glow">
      <header className="mx-auto w-full max-w-6xl px-5 h-16 flex items-center gap-3">
        <Link href="/" className="min-w-0 flex items-center gap-2.5 font-semibold tracking-tight text-[15px] text-ink">
          <BrandMark />
          <span className="truncate">{t("app.name")}</span>
        </Link>
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="rise w-full max-w-[420px]">
          <div className="rounded-2xl border border-rule bg-sheet p-6 sm:p-8 shadow-[0_1px_2px_rgba(9,9,11,0.04),0_24px_60px_-30px_color-mix(in_srgb,var(--violet)_45%,transparent)]">
            <div className="orb orb--sm mb-5" aria-hidden />
            <h1 className="text-[26px] text-ink mb-1.5">{t("login.title")}</h1>
            <p className="text-[14px] text-ink-2 mb-6">{t("login.subtitle")}</p>
            <LoginForm demo={{ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password }} />
          </div>
          <p className="mt-5 text-center text-[13px]">
            <Link href="/" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
              <ArrowLeft size={14} aria-hidden /> {t("login.back")}
            </Link>
          </p>
        </div>
      </div>

      <p className="px-4 py-4 text-center text-[11.5px] text-ink-3">{t("app.notice")}</p>
    </main>
  );
}

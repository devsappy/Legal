import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { BrandMark } from "@/components/ui/BrandMark";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "register" });
  return { title: t("title") };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getSessionUser()) redirect({ href: "/ask", locale });
  const t = await getTranslations();

  return (
    <main className="flex-1 flex flex-col bg-paper">
      <header className="nav-dark bg-ink/75 backdrop-blur-md text-paper">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 h-[68px] flex items-center gap-3">
          <Link href="/" className="min-w-0 flex items-center gap-3 font-semibold tracking-tight text-[16px] text-paper">
            <BrandMark size={30} className="!bg-paper !text-ink" />
            <span className="truncate">{t("app.name")}</span>
          </Link>
          <div className="ml-auto">
            <LanguageSwitcher size="md" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="rise w-full max-w-[420px]">
          <div className="rounded-2xl border border-rule bg-sheet p-6 sm:p-8">
            <BrandMark size={40} className="mb-6" />
            <h1 className="text-[28px] font-medium tracking-[-0.03em] text-ink mb-1.5">{t("register.title")}</h1>
            <p className="text-[14.5px] text-ink-2 mb-7">{t("register.subtitle")}</p>
            <RegisterForm />
          </div>
          <p className="mt-5 text-center text-[13px] text-ink-2">
            {t("register.haveAccount")}{" "}
            <Link href="/login" className="text-ink underline underline-offset-2">
              {t("login.title")}
            </Link>
          </p>
        </div>
      </div>

      <p className="px-4 py-4 text-center text-[11.5px] text-ink-3">{t("app.notice")}</p>
    </main>
  );
}

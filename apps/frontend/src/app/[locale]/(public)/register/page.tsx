import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** A pricing tile id such as "society"; anything else is ignored. */
const PLAN = /^[a-z][a-z0-9-]{0,31}$/;

function planFrom(v: string | string[] | undefined): string | null {
  const s = Array.isArray(v) ? v[0] : v;
  return s && PLAN.test(s) ? s : null;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "register" });
  return { title: t("title") };
}

/**
 * Create an account. `?plan=` from the pricing tiles is remembered on the
 * device once the account exists (indicative only: billing is not live).
 * Success always lands on /home?welcome=1.
 */
export default async function RegisterPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const plan = planFrom((await searchParams).plan);

  if (await getSessionUser()) redirect({ href: "/home", locale });

  const t = await getTranslations();

  return (
    <AuthShell
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      footer={
        <>
          <p>
            {t("register.haveAccount")}{" "}
            <Link href="/login" className="font-medium text-ink underline underline-offset-2 hover:text-ink-2">
              {t("login.title")}
            </Link>
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
            <ArrowLeft size={14} aria-hidden /> {t("auth.back")}
          </Link>
        </>
      }
    >
      <RegisterForm plan={plan} />
    </AuthShell>
  );
}

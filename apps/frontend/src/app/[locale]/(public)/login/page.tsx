import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, CornerDownRight } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { DEMO_ACCOUNT, getSessionUser } from "@/lib/auth";
import { safeNext } from "@/lib/next-path";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { DemoSignIn } from "@/components/auth/DemoSignIn";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: t("title") };
}

/**
 * Sign in. `?next=` (validated by safeNext) is where a deep link from the
 * marketing site wanted to go; `?demo=1` puts the focus on the one-click
 * demo button. A visitor who is already signed in is sent straight on.
 */
export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const next = safeNext(first(sp.next)) ?? "/home";
  const demo = first(sp.demo) === "1";

  if (await getSessionUser()) redirect({ href: next, locale });

  const t = await getTranslations();

  return (
    <AuthShell
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      footer={
        <>
          <p>
            {t("login.noAccount")}{" "}
            <Link href="/register" className="font-medium text-ink underline underline-offset-2 hover:text-ink-2">
              {t("register.title")}
            </Link>
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
            <ArrowLeft size={14} aria-hidden /> {t("auth.back")}
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {next !== "/home" && (
          <p className="flex items-start gap-2 rounded-lg border border-rule bg-muted/50 px-3 py-2 text-xs text-ink-2">
            <CornerDownRight size={14} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
            <span className="min-w-0 break-words">
              {t.rich("login.continueTo", {
                path: next,
                code: (chunks) => <code className="font-mono text-ink">{chunks}</code>,
              })}
            </span>
          </p>
        )}

        <LoginForm next={next} autoFocus={!demo} />

        <div className="flex items-center gap-3 text-xs text-ink-3" aria-hidden>
          <span className="h-px flex-1 bg-rule" />
          {t("auth.or")}
          <span className="h-px flex-1 bg-rule" />
        </div>

        <DemoSignIn demo={{ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password }} next={next} autoFocus={demo} />
      </div>
    </AuthShell>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import type { ReviewRow, SessionUser } from "@sahayak/shared";
import { redirect } from "@/i18n/navigation";
import { backendResult } from "@/lib/backend";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * The admin console frame: role gate, the section tabs with the open-review
 * count, and the content width. Each tab page owns its PageHeader. The
 * count is fetched once here; pages that change it call router.refresh().
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Only a confirmed non-admin is sent away; when the backend is down or the
  // session is gone the (app) layout renders its unavailable screen or the
  // sign-in redirect, and this frame stays out of the way.
  const me = await backendResult<{ ok: boolean; user: SessionUser | null }>("/api/auth/me");
  if (!me.ok) return null;
  if (me.data.user?.role !== "admin") redirect({ href: "/home", locale });
  const t = await getTranslations("admin");

  const reviews = await backendResult<{ rows: ReviewRow[] }>("/api/admin/reviews");
  const openCount = reviews.ok ? reviews.data.rows.filter((r) => r.status === "open").length : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pt-6">
      <div className="mb-6 flex flex-col gap-2 sm:mb-8">
        <p className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          <ShieldCheck size={12} strokeWidth={2} aria-hidden />
          {t("title")}
        </p>
        <AdminNav openCount={openCount} />
      </div>
      {children}
    </div>
  );
}

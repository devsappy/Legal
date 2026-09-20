import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (user?.role !== "admin") redirect({ href: "/ask", locale });
  const t = await getTranslations("admin");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-6 mb-5 sm:mb-6">
        <h1 className="text-[24px] sm:text-[26px]">{t("title")}</h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}

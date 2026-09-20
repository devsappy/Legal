import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/lib/auth";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: `${t("nav.profile")} · ${t("title")}` };
}

/** Settings › Profile: name, sign-in email, role, and the password change. */
export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // The (app) layout owns the sign-in gate; nothing to draw without a user.
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <>
      <ProfileForm user={user} />
      <PasswordForm />
    </>
  );
}

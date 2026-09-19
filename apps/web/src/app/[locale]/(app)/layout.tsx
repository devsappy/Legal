import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { ChatProvider } from "@/components/chat/ChatProvider";

/** Everything behind sign-in: the assistant, procedures and admin. */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale });

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <ChatProvider>
        <AppShell user={user!}>{children}</AppShell>
      </ChatProvider>
    </div>
  );
}

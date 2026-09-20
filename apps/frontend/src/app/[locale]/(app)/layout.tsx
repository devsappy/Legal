import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import type { SessionUser } from "@sahayak/shared";
import { redirect } from "@/i18n/navigation";
import { backendResult } from "@/lib/backend";
import { loginHref } from "@/lib/routes";
import { PATHNAME_HEADER, safeNext } from "@/lib/next-path";
import { AppShell } from "@/components/layout/AppShell";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { CommandProvider } from "@/components/command/CommandProvider";
import { HelpProvider } from "@/components/help/HelpProvider";

/** /login?next=<the page that was asked for>, so an expired session lands back where it was. */
async function signInHref(): Promise<string> {
  const next = safeNext((await headers()).get(PATHNAME_HEADER));
  return loginHref(next ?? "/home");
}

/**
 * Everything behind sign-in: home, the assistant, procedures, settings and
 * admin. The session is checked here once per request; "signed out" (401)
 * goes to /login, while "backend unreachable" (network or 5xx) renders a
 * minimal shell with Retry instead of bouncing a valid session to the
 * sign-in page.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const res = await backendResult<{ ok: boolean; user: SessionUser | null }>("/api/auth/me");
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) redirect({ href: await signInHref(), locale });
    return <ServiceUnavailable />;
  }
  const user = res.data.user;
  if (!user) redirect({ href: await signInHref(), locale });

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <ChatProvider>
        <CommandProvider user={user!}>
          <HelpProvider>
            <AppShell user={user!}>{children}</AppShell>
          </HelpProvider>
        </CommandProvider>
      </ChatProvider>
    </div>
  );
}

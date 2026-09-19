import { cookies } from "next/headers";

/**
 * Demo sign-in. One fixed account, one opaque session cookie.
 * Swap `verify` and `getSessionUser` for the real identity provider
 * when the backend grows accounts; the pages only depend on these two.
 */
export const SESSION_COOKIE = "coop_session";
const SESSION_TOKEN = "demo";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // a week

export type SessionUser = { name: string; email: string };

export const DEMO_ACCOUNT = {
  email: "test@gmail.com",
  password: "1234",
  name: "Test User",
} as const;

export function verify(email: string, password: string): SessionUser | null {
  const ok =
    email.trim().toLowerCase() === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password;
  return ok ? { name: DEMO_ACCOUNT.name, email: DEMO_ACCOUNT.email } : null;
}

export const sessionCookie = {
  name: SESSION_COOKIE,
  value: SESSION_TOKEN,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value === SESSION_TOKEN
    ? { name: DEMO_ACCOUNT.name, email: DEMO_ACCOUNT.email }
    : null;
}

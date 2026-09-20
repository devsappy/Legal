import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import type { SessionUser } from "@sahayak/shared";
import { SESSION_COOKIE, userForToken } from "./auth";

/** The signed-in user for this request, or null. */
export function currentUser(c: Context): Promise<SessionUser | null> {
  return userForToken(getCookie(c, SESSION_COOKIE));
}

/** 401/403 response for routes that need a signed-in (admin) user, else the user. */
export async function requireUser(c: Context, role?: "admin"): Promise<{ user: SessionUser } | { response: Response }> {
  const user = await currentUser(c);
  if (!user) return { response: c.json({ ok: false }, 401) };
  if (role && user.role !== role) return { response: c.json({ ok: false }, 403) };
  return { user };
}

import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { cookieOptions, createSession, destroySession, register, SESSION_COOKIE, verify } from "../lib/auth";
import { currentUser } from "../lib/admin";

export const auth = new Hono();

auth.post("/login", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string; password?: string };
  const user = verify(body.email ?? "", body.password ?? "");
  if (!user) return c.json({ ok: false }, 401);
  const { token, expires } = createSession(user.id);
  setCookie(c, SESSION_COOKIE, token, cookieOptions(expires));
  return c.json({ ok: true, user });
});

auth.post("/register", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string; name?: string; password?: string };
  const result = register(body.email ?? "", body.name ?? "", body.password ?? "");
  if (!result.ok) return c.json({ ok: false, error: result.error }, result.error === "exists" ? 409 : 400);
  const { token, expires } = createSession(result.user.id);
  setCookie(c, SESSION_COOKIE, token, cookieOptions(expires));
  return c.json({ ok: true, user: result.user });
});

auth.post("/logout", (c) => {
  destroySession(getCookie(c, SESSION_COOKIE));
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

/** Who is signed in — the frontend's server components ask this on every gated page. */
auth.get("/me", (c) => {
  const user = currentUser(c);
  return user ? c.json({ ok: true, user }) : c.json({ ok: false, user: null }, 401);
});

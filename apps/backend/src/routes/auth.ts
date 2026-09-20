import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { cookieOptions, createSession, destroySession, register, SESSION_COOKIE, verify } from "../lib/auth";
import { currentUser, requireUser } from "../lib/admin";
import { checkPassword, db, hashPassword } from "../lib/db";

export const auth = new Hono();

auth.post("/login", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string; password?: string };
  const user = await verify(body.email ?? "", body.password ?? "");
  if (!user) return c.json({ ok: false }, 401);
  const { token, expires } = await createSession(user.id);
  setCookie(c, SESSION_COOKIE, token, cookieOptions(expires));
  return c.json({ ok: true, user });
});

auth.post("/register", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string; name?: string; password?: string };
  const result = await register(body.email ?? "", body.name ?? "", body.password ?? "");
  if (!result.ok) return c.json({ ok: false, error: result.error }, result.error === "exists" ? 409 : 400);
  const { token, expires } = await createSession(result.user.id);
  setCookie(c, SESSION_COOKIE, token, cookieOptions(expires));
  return c.json({ ok: true, user: result.user });
});

auth.post("/logout", async (c) => {
  await destroySession(getCookie(c, SESSION_COOKIE));
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

/** Who is signed in — the frontend's server components ask this on every gated page. */
auth.get("/me", async (c) => {
  const user = await currentUser(c);
  return user ? c.json({ ok: true, user }) : c.json({ ok: false, user: null }, 401);
});

/**
 * Update the signed-in user's name and/or password (Settings › Profile).
 * A password change needs the current password to match; nothing is
 * written unless every supplied field validates.
 *   400 { error: "invalid" }  name outside 2–80 chars, new password under 6, or nothing to change
 *   400 { error: "password" } the current password is wrong or missing
 */
auth.patch("/me", async (c) => {
  const gate = await requireUser(c);
  if ("response" in gate) return gate.response;
  const body = (await c.req.json().catch(() => ({}))) as {
    name?: unknown;
    currentPassword?: unknown;
    newPassword?: unknown;
  };

  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : undefined;
  if (name !== undefined && (name.length < 2 || name.length > 80)) return c.json({ ok: false, error: "invalid" }, 400);

  const newPassword = typeof body.newPassword === "string" ? body.newPassword : undefined;
  if (newPassword !== undefined) {
    if (newPassword.length < 6) return c.json({ ok: false, error: "invalid" }, 400);
    const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const [row] = await db()<{ password_hash: string }[]>`SELECT password_hash FROM users WHERE id = ${gate.user.id}`;
    if (!row || !current || !checkPassword(current, row.password_hash)) return c.json({ ok: false, error: "password" }, 400);
  }

  if (name === undefined && newPassword === undefined) return c.json({ ok: false, error: "invalid" }, 400);

  if (name !== undefined) await db()`UPDATE users SET name = ${name} WHERE id = ${gate.user.id}`;
  if (newPassword !== undefined) await db()`UPDATE users SET password_hash = ${hashPassword(newPassword)} WHERE id = ${gate.user.id}`;

  return c.json({ ok: true, user: { ...gate.user, name: name ?? gate.user.name } });
});

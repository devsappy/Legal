import type { SessionUser } from "@sahayak/shared";
import { checkPassword, db, hashPassword, isUniqueViolation, newToken, type UserRow } from "./db";

/**
 * Cookie sessions backed by the users/sessions tables. The demo account
 * (test@gmail.com / 1234, admin) is seeded by the database on first run
 * so the sign-in page works without any setup.
 */
export const SESSION_COOKIE = "coop_session";
const SESSION_DAYS = 7;

export type { SessionUser };

export const DEMO_ACCOUNT = { email: "test@gmail.com", password: "1234", name: "Test User" } as const;

const toUser = (u: UserRow): SessionUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  ...(u.created_at ? { createdAt: u.created_at } : {}),
});

export async function verify(email: string, password: string): Promise<SessionUser | null> {
  const [row] = await db()<(UserRow & { password_hash: string })[]>`
    SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = ${email.trim().toLowerCase()}`;
  if (!row || !checkPassword(password, row.password_hash)) return null;
  return toUser(row);
}

export type RegisterResult = { ok: true; user: SessionUser } | { ok: false; error: "exists" | "invalid" };

export async function register(email: string, name: string, password: string): Promise<RegisterResult> {
  const e = email.trim().toLowerCase();
  const n = name.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || n.length < 2 || password.length < 6) return { ok: false, error: "invalid" };
  try {
    const [row] = await db()<{ id: number }[]>`
      INSERT INTO users (email, name, password_hash) VALUES (${e}, ${n}, ${hashPassword(password)}) RETURNING id`;
    return { ok: true, user: { id: row.id, name: n, email: e, role: "member" } };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: "exists" };
    throw err;
  }
}

export async function createSession(userId: number) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db()`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expires.toISOString()})`;
  return { token, expires };
}

export async function destroySession(token: string | undefined) {
  if (token) await db()`DELETE FROM sessions WHERE token = ${token}`;
}

export async function userForToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const [row] = await db()<UserRow[]>`
    SELECT u.id, u.email, u.name, u.role, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()`;
  return row ? toUser(row) : null;
}

/** Cookie attributes for hono's setCookie / deleteCookie. */
export function cookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "Lax" as const,
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "0",
    path: "/",
    ...(expires ? { expires } : {}),
  };
}

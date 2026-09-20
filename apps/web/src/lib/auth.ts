import { cookies } from "next/headers";
import { checkPassword, db, hashPassword, newToken, type Role, type UserRow } from "./db";

/**
 * Cookie sessions backed by the users/sessions tables. The demo account
 * (test@gmail.com / 1234, admin) is seeded by the database on first run
 * so the sign-in page works without any setup.
 */
export const SESSION_COOKIE = "coop_session";
const SESSION_DAYS = 7;

export type SessionUser = { id: number; name: string; email: string; role: Role };

export const DEMO_ACCOUNT = { email: "test@gmail.com", password: "1234", name: "Test User" } as const;

const toUser = (u: UserRow): SessionUser => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export function verify(email: string, password: string): SessionUser | null {
  const row = db()
    .prepare("SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as (UserRow & { password_hash: string }) | undefined;
  if (!row || !checkPassword(password, row.password_hash)) return null;
  return toUser(row);
}

export type RegisterResult = { ok: true; user: SessionUser } | { ok: false; error: "exists" | "invalid" };

export function register(email: string, name: string, password: string): RegisterResult {
  const e = email.trim().toLowerCase();
  const n = name.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || n.length < 2 || password.length < 6) return { ok: false, error: "invalid" };
  try {
    const info = db().prepare("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)").run(e, n, hashPassword(password));
    return { ok: true, user: { id: Number(info.lastInsertRowid), name: n, email: e, role: "member" } };
  } catch {
    return { ok: false, error: "exists" };
  }
}

export function createSession(userId: number) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  db().prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires.toISOString());
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}

export function destroySession(token: string | undefined) {
  if (token) db().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  return { name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 0 };
}

export function userForToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`,
    )
    .get(token) as UserRow | undefined;
  return row ? toUser(row) : null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return userForToken(jar.get(SESSION_COOKIE)?.value);
}

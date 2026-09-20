import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "./auth";

/** Admin-only API routes: returns the user, or the 401/403 response to send. */
export async function requireAdmin(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getSessionUser();
  if (!user) return { response: NextResponse.json({ ok: false }, { status: 401 }) };
  if (user.role !== "admin") return { response: NextResponse.json({ ok: false }, { status: 403 }) };
  return { user };
}

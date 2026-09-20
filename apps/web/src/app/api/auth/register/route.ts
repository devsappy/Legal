import { NextResponse, type NextRequest } from "next/server";
import { createSession, register } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; name?: string; password?: string };
  const result = register(body.email ?? "", body.name ?? "", body.password ?? "");
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "exists" ? 409 : 400 });
  const res = NextResponse.json({ ok: true, user: result.user });
  res.cookies.set(createSession(result.user.id));
  return res;
}

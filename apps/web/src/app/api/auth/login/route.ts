import { NextResponse, type NextRequest } from "next/server";
import { createSession, verify } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const user = verify(body.email ?? "", body.password ?? "");
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(createSession(user.id));
  return res;
}

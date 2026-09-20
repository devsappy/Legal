import { NextResponse, type NextRequest } from "next/server";
import { destroySession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(destroySession(req.cookies.get(SESSION_COOKIE)?.value));
  return res;
}

import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Mark a review item resolved (or reopen it). */
export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;
  const b = (await req.json().catch(() => ({}))) as { id?: number; status?: "open" | "resolved" };
  if (!b.id || (b.status !== "open" && b.status !== "resolved")) return NextResponse.json({ ok: false }, { status: 400 });
  db().prepare("UPDATE reviews SET status = ? WHERE id = ?").run(b.status, b.id);
  return NextResponse.json({ ok: true });
}

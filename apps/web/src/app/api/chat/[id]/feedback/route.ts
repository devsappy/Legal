import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Thumbs up/down from the Ask page. A thumbs-down also opens a review item. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getSessionUser();
  const body = (await req.json().catch(() => ({}))) as {
    value?: "up" | "down";
    note?: string;
    question?: string;
    answer?: string;
    language?: string;
    jurisdiction?: string;
  };
  if (body.value !== "up" && body.value !== "down") return NextResponse.json({ ok: false }, { status: 400 });
  const d = db();
  d.prepare("INSERT INTO feedback (message_id, user_id, value, note) VALUES (?, ?, ?, ?)").run(id, user?.id ?? null, body.value, body.note ?? null);
  if (body.value === "down" && body.question) {
    d.prepare(
      "INSERT INTO reviews (question, answer, language, jurisdiction, confidence, reason) VALUES (?, ?, ?, ?, ?, 'thumbs_down')",
    ).run(body.question, body.answer ?? "", body.language ?? "en", body.jurisdiction ?? "central", 0);
  }
  return NextResponse.json({ ok: true });
}

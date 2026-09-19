import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

/** Thumbs up/down from the Ask page, appended to data/feedback.jsonl. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { value?: "up" | "down"; note?: string };
  if (body.value !== "up" && body.value !== "down") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  const line = JSON.stringify({ id, value: body.value, note: body.note ?? null, at: new Date().toISOString() });
  await fs.appendFile(path.join(dir, "feedback.jsonl"), line + "\n", "utf8");
  return NextResponse.json({ ok: true });
}

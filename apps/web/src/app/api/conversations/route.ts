import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, type ConversationRow } from "@/lib/db";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

/** The signed-in user's conversations, newest first (titles + transcripts). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const rows = db()
    .prepare("SELECT id, title, messages, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100")
    .all(user.id) as Pick<ConversationRow, "id" | "title" | "messages" | "updated_at">[];
  return NextResponse.json({
    ok: true,
    conversations: rows.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: new Date(r.updated_at + "Z").getTime(),
      messages: JSON.parse(r.messages) as ChatMessage[],
    })),
  });
}

/** Upsert one conversation. */
export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: string; title?: string; messages?: ChatMessage[] } | null;
  if (!body?.id || !body.title || !Array.isArray(body.messages)) return NextResponse.json({ ok: false }, { status: 400 });
  db()
    .prepare(
      `INSERT INTO conversations (id, user_id, title, messages, updated_at) VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET title = excluded.title, messages = excluded.messages, updated_at = datetime('now')
       WHERE conversations.user_id = excluded.user_id`,
    )
    .run(body.id, user.id, body.title.slice(0, 200), JSON.stringify(body.messages));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  db().prepare("DELETE FROM conversations WHERE id = ? AND user_id = ?").run(id, user.id);
  return NextResponse.json({ ok: true });
}

import { Hono } from "hono";
import type { ChatMessage } from "@sahayak/shared";
import { db, type ConversationRow } from "../lib/db";
import { requireUser } from "../lib/admin";

export const conversations = new Hono();

/** The signed-in user's conversations, newest first (titles + transcripts). */
conversations.get("/", (c) => {
  const gate = requireUser(c);
  if ("response" in gate) return gate.response;
  const rows = db()
    .prepare("SELECT id, title, messages, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100")
    .all(gate.user.id) as Pick<ConversationRow, "id" | "title" | "messages" | "updated_at">[];
  return c.json({
    ok: true,
    conversations: rows.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: new Date(r.updated_at + "Z").getTime(),
      messages: JSON.parse(r.messages) as ChatMessage[],
    })),
  });
});

/** Upsert one conversation. */
conversations.put("/", async (c) => {
  const gate = requireUser(c);
  if ("response" in gate) return gate.response;
  const body = (await c.req.json().catch(() => null)) as { id?: string; title?: string; messages?: ChatMessage[] } | null;
  if (!body?.id || !body.title || !Array.isArray(body.messages)) return c.json({ ok: false }, 400);
  db()
    .prepare(
      `INSERT INTO conversations (id, user_id, title, messages, updated_at) VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET title = excluded.title, messages = excluded.messages, updated_at = datetime('now')
       WHERE conversations.user_id = excluded.user_id`,
    )
    .run(body.id, gate.user.id, body.title.slice(0, 200), JSON.stringify(body.messages));
  return c.json({ ok: true });
});

conversations.delete("/", (c) => {
  const gate = requireUser(c);
  if ("response" in gate) return gate.response;
  const id = c.req.query("id");
  if (!id) return c.json({ ok: false }, 400);
  db().prepare("DELETE FROM conversations WHERE id = ? AND user_id = ?").run(id, gate.user.id);
  return c.json({ ok: true });
});

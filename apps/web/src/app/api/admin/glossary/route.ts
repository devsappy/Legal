import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db, type GlossaryRow } from "@/lib/db";

export const runtime = "nodejs";

type Body = Partial<GlossaryRow>;

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;
  const b = (await req.json().catch(() => ({}))) as Body;
  if (!b.term?.trim()) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const info = db()
      .prepare("INSERT INTO glossary (term, hi, mr, ta, source) VALUES (?, ?, ?, ?, ?)")
      .run(b.term.trim(), b.hi ?? "", b.mr ?? "", b.ta ?? "", b.source ?? "");
    return NextResponse.json({ ok: true, id: Number(info.lastInsertRowid) });
  } catch {
    return NextResponse.json({ ok: false, error: "exists" }, { status: 409 });
  }
}

export async function PUT(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;
  const b = (await req.json().catch(() => ({}))) as Body;
  if (!b.id || !b.term?.trim()) return NextResponse.json({ ok: false }, { status: 400 });
  db()
    .prepare("UPDATE glossary SET term = ?, hi = ?, mr = ?, ta = ?, source = ? WHERE id = ?")
    .run(b.term.trim(), b.hi ?? "", b.mr ?? "", b.ta ?? "", b.source ?? "", b.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  db().prepare("DELETE FROM glossary WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}

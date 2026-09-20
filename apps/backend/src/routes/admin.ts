import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { Hono } from "hono";
import { JURISDICTIONS, type DocumentRow, type GlossaryRow, type ReviewRow } from "@sahayak/shared";
import { requireUser } from "../lib/admin";
import { db } from "../lib/db";
import { loadCorpus } from "../lib/rag/corpus";
import { getIndex, hasIndex, resetIndex } from "../lib/rag/embeddings";

const run = promisify(execFile);
export const admin = new Hono();

// Every route here is admin-only.
admin.use("*", async (c, next) => {
  const gate = requireUser(c, "admin");
  if ("response" in gate) return gate.response;
  await next();
});

/* ---- documents: the live corpus ---- */
admin.get("/documents", async (c) => {
  const sections = await loadCorpus();
  const byFile = new Map<string, DocumentRow>();
  for (const s of sections) {
    const row = byFile.get(s.file) ?? { file: s.file, title: s.act, jurisdiction: s.jurisdiction, sections: 0, updated: "", untitled: 0 };
    row.sections += 1;
    if (!s.title) row.untitled += 1;
    byFile.set(s.file, row);
  }
  const rows = await Promise.all(
    [...byFile.values()].map(async (r) => {
      const st = await fs.stat(path.join(process.cwd(), r.file)).catch(() => null);
      return { ...r, file: r.file.replace(/\\/g, "/"), updated: st ? st.mtime.toISOString().slice(0, 10) : "" };
    }),
  );
  rows.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction) || b.sections - a.sections);
  return c.json({ ok: true, rows, sections: sections.length, indexed: await hasIndex(sections) });
});

/**
 * Upload an Act. Markdown/text is stored as-is under corpus/<jurisdiction>/;
 * a PDF is kept under corpus/_sources/ and converted with scripts/ingest.mjs.
 */
admin.post("/documents", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  const jurisdiction = String(form.get("jurisdiction") ?? "");
  const title = String(form.get("title") ?? "").trim();
  if (!(file instanceof File) || !JURISDICTIONS.some((j) => j.id === jurisdiction) || title.length < 3) {
    return c.json({ ok: false, error: "invalid" }, 400);
  }
  const ext = path.extname(file.name).toLowerCase();
  if (![".pdf", ".md", ".txt"].includes(ext)) return c.json({ ok: false, error: "type" }, 400);

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "act";
  const bytes = Buffer.from(await file.arrayBuffer());
  const root = process.cwd();

  if (ext === ".pdf") {
    const src = path.join(root, "corpus", "_sources", `${slug}.pdf`);
    await fs.mkdir(path.dirname(src), { recursive: true });
    await fs.writeFile(src, bytes);
    try {
      const { stdout } = await run(process.execPath, [path.join(root, "scripts", "ingest.mjs"), src, jurisdiction, title, "--out", `${slug}.md`], {
        cwd: root,
        timeout: 120_000,
      });
      const m = /^(\d+) sections/.exec(stdout);
      return c.json({ ok: true, file: `corpus/${jurisdiction}/${slug}.md`, sections: m ? Number(m[1]) : null });
    } catch (err) {
      return c.json({ ok: false, error: "ingest", detail: (err as Error).message.slice(0, 300) }, 500);
    }
  }

  const dest = path.join(root, "corpus", jurisdiction, `${slug}.md`);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  let text = bytes.toString("utf8");
  if (!/^#\s+/m.test(text)) text = `# ${title}\n\n${text}`;
  await fs.writeFile(dest, text, "utf8");
  return c.json({ ok: true, file: `corpus/${jurisdiction}/${slug}.md`, sections: (text.match(/^##\s+/gm) ?? []).length });
});

/** Rebuilds the embedding index for the current corpus (no-op if unchanged). */
admin.post("/reindex", async (c) => {
  const started = Date.now();
  resetIndex();
  const sections = await loadCorpus();
  const index = await getIndex(sections);
  return c.json({
    ok: true,
    sections: sections.length,
    embedded: index?.ids.length ?? 0,
    seconds: Math.round((Date.now() - started) / 1000),
    note: index ? null : "embedding server not reachable; BM25 only",
  });
});

/* ---- glossary ---- */
type GlossaryBody = Partial<GlossaryRow>;

admin.get("/glossary", (c) => {
  const rows = db().prepare("SELECT id, term, hi, mr, ta, source FROM glossary ORDER BY term").all() as GlossaryRow[];
  return c.json({ ok: true, rows });
});

admin.post("/glossary", async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as GlossaryBody;
  if (!b.term?.trim()) return c.json({ ok: false }, 400);
  try {
    const info = db().prepare("INSERT INTO glossary (term, hi, mr, ta, source) VALUES (?, ?, ?, ?, ?)").run(b.term.trim(), b.hi ?? "", b.mr ?? "", b.ta ?? "", b.source ?? "");
    return c.json({ ok: true, id: Number(info.lastInsertRowid) });
  } catch {
    return c.json({ ok: false, error: "exists" }, 409);
  }
});

admin.put("/glossary", async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as GlossaryBody;
  if (!b.id || !b.term?.trim()) return c.json({ ok: false }, 400);
  db().prepare("UPDATE glossary SET term = ?, hi = ?, mr = ?, ta = ?, source = ? WHERE id = ?").run(b.term.trim(), b.hi ?? "", b.mr ?? "", b.ta ?? "", b.source ?? "", b.id);
  return c.json({ ok: true });
});

admin.delete("/glossary", (c) => {
  const id = Number(c.req.query("id"));
  if (!id) return c.json({ ok: false }, 400);
  db().prepare("DELETE FROM glossary WHERE id = ?").run(id);
  return c.json({ ok: true });
});

/* ---- review queue ---- */
admin.get("/reviews", (c) => {
  const rows = db()
    .prepare("SELECT * FROM reviews ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC LIMIT 200")
    .all() as ReviewRow[];
  return c.json({ ok: true, rows });
});

admin.patch("/reviews", async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { id?: number; status?: "open" | "resolved" };
  if (!b.id || (b.status !== "open" && b.status !== "resolved")) return c.json({ ok: false }, 400);
  db().prepare("UPDATE reviews SET status = ? WHERE id = ?").run(b.status, b.id);
  return c.json({ ok: true });
});

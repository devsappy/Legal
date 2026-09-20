import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { Hono } from "hono";
import { JURISDICTIONS, type DocumentRow, type GlossaryRow, type ReviewRow } from "@sahayak/shared";
import { requireUser } from "../lib/admin";
import { db, isUniqueViolation } from "../lib/db";
import { loadCorpus } from "../lib/rag/corpus";
import { getIndex, hasIndex, resetIndex } from "../lib/rag/embeddings";

const run = promisify(execFile);
export const admin = new Hono();

/** Where lib/rag/embeddings writes `<stamp>.bin`; read-only here, for the "last built" time. */
const INDEX_DIR = path.join(process.cwd(), "data", "index");

/**
 * When the vector index was last written, as an ISO string, or undefined
 * when no index file exists. The stamp is private to lib/rag, so the newest
 * `.bin` under data/index stands in for "the" index file.
 */
async function indexedAt(): Promise<string | undefined> {
  const names = await fs.readdir(INDEX_DIR).catch(() => [] as string[]);
  let latest = 0;
  for (const name of names) {
    if (!name.endsWith(".bin")) continue;
    const st = await fs.stat(path.join(INDEX_DIR, name)).catch(() => null);
    if (st && st.mtimeMs > latest) latest = st.mtimeMs;
  }
  return latest ? new Date(latest).toISOString() : undefined;
}

// Every route here is admin-only.
admin.use("*", async (c, next) => {
  const gate = await requireUser(c, "admin");
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
  const [indexed, builtAt] = await Promise.all([hasIndex(sections), indexedAt()]);
  return c.json({ ok: true, rows, sections: sections.length, indexed, ...(builtAt ? { indexedAt: builtAt } : {}) });
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
  const builtAt = await indexedAt();
  return c.json({
    ok: true,
    sections: sections.length,
    embedded: index?.ids.length ?? 0,
    seconds: Math.round((Date.now() - started) / 1000),
    note: index ? null : "embedding server not reachable; BM25 only",
    ...(builtAt ? { indexedAt: builtAt } : {}),
  });
});

/* ---- glossary ---- */
type GlossaryBody = Partial<GlossaryRow>;

admin.get("/glossary", async (c) => {
  const rows = await db()<GlossaryRow[]>`SELECT id, term, hi, mr, ta, source FROM glossary ORDER BY term`;
  return c.json({ ok: true, rows });
});

admin.post("/glossary", async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as GlossaryBody;
  if (!b.term?.trim()) return c.json({ ok: false }, 400);
  try {
    const [row] = await db()<{ id: number }[]>`
      INSERT INTO glossary (term, hi, mr, ta, source) VALUES (${b.term.trim()}, ${b.hi ?? ""}, ${b.mr ?? ""}, ${b.ta ?? ""}, ${b.source ?? ""}) RETURNING id`;
    return c.json({ ok: true, id: row.id });
  } catch (err) {
    if (isUniqueViolation(err)) return c.json({ ok: false, error: "exists" }, 409);
    throw err;
  }
});

admin.put("/glossary", async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as GlossaryBody;
  if (!b.id || !b.term?.trim()) return c.json({ ok: false }, 400);
  try {
    const result = await db()`
      UPDATE glossary SET term = ${b.term.trim()}, hi = ${b.hi ?? ""}, mr = ${b.mr ?? ""}, ta = ${b.ta ?? ""}, source = ${b.source ?? ""} WHERE id = ${b.id}`;
    if (result.count === 0) return c.json({ ok: false, error: "not_found" }, 404);
    return c.json({ ok: true });
  } catch (err) {
    // The UNIQUE index on term: renaming onto another entry's term.
    if (isUniqueViolation(err)) return c.json({ ok: false, error: "exists" }, 409);
    throw err;
  }
});

admin.delete("/glossary", async (c) => {
  const id = Number(c.req.query("id"));
  if (!id) return c.json({ ok: false }, 400);
  await db()`DELETE FROM glossary WHERE id = ${id}`;
  return c.json({ ok: true });
});

/* ---- review queue ---- */
admin.get("/reviews", async (c) => {
  const rows = await db()<ReviewRow[]>`
    SELECT * FROM reviews ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC LIMIT 200`;
  return c.json({ ok: true, rows });
});

/**
 * Flip one or many reviews: `{ id, status }` (the original shape) or
 * `{ ids: [...], status }` for the bulk bar. All rows change in one
 * transaction; `updated` is how many actually existed.
 */
admin.patch("/reviews", async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { id?: number; ids?: number[]; status?: "open" | "resolved" };
  const ids = [...new Set([...(Array.isArray(b.ids) ? b.ids : []), ...(b.id !== undefined ? [b.id] : [])])].filter(
    (n): n is number => Number.isInteger(n) && n > 0,
  );
  if (ids.length === 0 || ids.length > 500 || (b.status !== "open" && b.status !== "resolved")) return c.json({ ok: false }, 400);
  const status = b.status;
  const result = await db()`UPDATE reviews SET status = ${status} WHERE id = ANY(${ids}::int[])`;
  return c.json({ ok: true, updated: result.count });
});

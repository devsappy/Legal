import { Hono } from "hono";
import { JURISDICTIONS } from "@sahayak/shared";
import { db } from "../lib/db";
import { LLM_URL } from "../lib/llm";
import { EMBED_URL } from "../lib/rag/embeddings";
import { loadCorpus } from "../lib/rag/corpus";
import { findProcedure, loadProcedures } from "../lib/procedures";

/** Routes that need no sign-in: health, procedures, landing-page numbers. */
export const pub = new Hono();

pub.get("/health", async (c) => {
  const probe = async (url: string) => {
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok ? "ok" : `http ${res.status}`;
    } catch {
      return "unreachable";
    }
  };
  const [llm, embed, corpus] = await Promise.all([probe(LLM_URL), probe(EMBED_URL), loadCorpus().then((s) => s.length).catch(() => 0)]);
  let database = "ok";
  try {
    db().prepare("SELECT 1").get();
  } catch (err) {
    database = (err as Error).message;
  }
  const ok = database === "ok" && llm === "ok" && corpus > 0;
  return c.json({ ok, database, llm, embed: embed === "ok" ? "ok" : `${embed} (BM25 only)`, corpusSections: corpus }, ok ? 200 : 503);
});

pub.get("/procedures", async (c) => c.json({ ok: true, procedures: await loadProcedures() }));

pub.get("/procedures/:slug", async (c) => {
  const p = await findProcedure(c.req.param("slug"));
  return p ? c.json({ ok: true, procedure: p }) : c.json({ ok: false }, 404);
});

/** Numbers for the landing page. */
pub.get("/stats", async (c) => {
  const [corpus, procedures] = await Promise.all([loadCorpus(), loadProcedures()]);
  return c.json({ ok: true, sections: corpus.length, procedures: procedures.length, acts: JURISDICTIONS.length });
});

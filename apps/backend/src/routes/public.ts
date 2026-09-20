import { createRequire } from "node:module";
import { Hono } from "hono";
import { JURISDICTIONS } from "@sahayak/shared";
import { db } from "../lib/db";
import { LLM_URL } from "../lib/llm";
import { EMBED_URL } from "../lib/rag/embeddings";
import { loadCorpus } from "../lib/rag/corpus";
import { findProcedure, loadProcedures } from "../lib/procedures";

/** Routes that need no sign-in: health, procedures, landing-page numbers. */
export const pub = new Hono();

/* Reported on /health so the status page can show what is running and since when. */
const { version: VERSION } = createRequire(import.meta.url)("../../package.json") as { version: string };
const STARTED_AT = new Date().toISOString();

type HealthPayload = {
  ok: boolean;
  database: string;
  llm: string;
  embed: string;
  corpusSections: number;
  version: string;
  startedAt: string;
};

/**
 * The LLM and embedding probes each wait up to 3 s when a server is down, so
 * one result is reused for 15 s: the footer dot, the status page and admin
 * overview polling at once cost a single round of probes. A request that
 * arrives while probes are in flight shares them instead of starting more.
 */
const HEALTH_TTL = 15_000;
let healthCache: { payload: HealthPayload; status: 200 | 503; at: number } | null = null;
let healthInflight: Promise<{ payload: HealthPayload; status: 200 | 503 }> | null = null;

async function probeHealth(): Promise<{ payload: HealthPayload; status: 200 | 503 }> {
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
    await db()`SELECT 1`;
  } catch (err) {
    database = (err as Error).message;
  }
  const ok = database === "ok" && llm === "ok" && corpus > 0;
  return {
    payload: {
      ok,
      database,
      llm,
      embed: embed === "ok" ? "ok" : `${embed} (BM25 only)`,
      corpusSections: corpus,
      version: VERSION,
      startedAt: STARTED_AT,
    },
    status: ok ? 200 : 503,
  };
}

pub.get("/health", async (c) => {
  const now = Date.now();
  if (healthCache && now - healthCache.at < HEALTH_TTL) return c.json(healthCache.payload, healthCache.status);
  if (!healthInflight) {
    healthInflight = probeHealth()
      .then((result) => {
        healthCache = { ...result, at: Date.now() };
        return result;
      })
      .finally(() => {
        healthInflight = null;
      });
  }
  const result = await healthInflight;
  return c.json(result.payload, result.status);
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

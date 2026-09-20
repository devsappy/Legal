import { loadCorpus, type Section } from "./corpus";
import { embedQuery, getIndex, rank } from "./embeddings";
import { search, type Hit } from "./search";

/**
 * Hybrid retrieval: BM25 and dense cosine ranks fused with reciprocal-rank
 * fusion, then weighted so the selected jurisdiction's own Act outranks the
 * central corpus that is always searched alongside it.
 */
const RRF_K = 60;
const CENTRAL_WEIGHT = 0.7;

export type Retrieved = Hit & { lexical: number; semantic: number; method: "hybrid" | "bm25" };

export async function retrieve(
  sections: Section[],
  lexicalQuery: string,
  semanticQuery: string,
  jurisdiction: string,
  k = 5,
): Promise<Retrieved[]> {
  const pool = Math.max(20, k * 4);
  const lexical = search(sections, lexicalQuery, pool);

  // One index for the whole corpus; rank inside the sections this question may use.
  const allowed = new Set(sections.map((s) => s.id));
  const [index, qv] = await Promise.all([loadCorpus().then(getIndex), embedQuery(semanticQuery)]);
  const dense = index && qv ? rank(index, qv, pool, allowed) : [];
  const method = dense.length ? "hybrid" : "bm25";

  const byId = new Map(sections.map((s) => [s.id, s]));
  const fused = new Map<string, Retrieved>();
  const bump = (id: string, r: number, field: "lexical" | "semantic", raw: number) => {
    const section = byId.get(id);
    if (!section) return;
    const cur = fused.get(id) ?? { section, score: 0, lexical: 0, semantic: 0, method };
    cur.score += 1 / (RRF_K + r);
    cur[field] = raw;
    fused.set(id, cur);
  };
  lexical.forEach((h, r) => bump(h.section.id, r, "lexical", h.score));
  dense.forEach((d, r) => bump(d.id, r, "semantic", d.score));

  for (const h of fused.values()) {
    if (jurisdiction !== "central" && h.section.jurisdiction === "central") h.score *= CENTRAL_WEIGHT;
  }
  return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, k);
}

/** 0..1 — how convincingly the best hit stands out. */
export function confidenceOf(hits: Retrieved[]): number {
  if (!hits.length) return 0.1;
  const top = hits[0];
  // Agreement between the two signals is the strongest evidence we have.
  const both = top.lexical > 0 && top.semantic > 0 ? 0.25 : 0;
  const lex = top.lexical / (top.lexical + 4);
  const sem = Math.max(0, (top.semantic - 0.3) / 0.5);
  return Math.max(0.15, Math.min(0.95, 0.35 * lex + 0.4 * sem + both));
}

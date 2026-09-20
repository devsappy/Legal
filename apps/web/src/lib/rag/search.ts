import type { Section } from "./corpus";

/**
 * BM25 over section text. Lexical on purpose: it needs no embedding model
 * on the GPU, and the question is first turned into English search terms
 * by the LLM so Hindi/Marathi/Tamil questions still hit English Acts.
 */
const K1 = 1.4;
const B = 0.75;

const STOP = new Set(
  "a an and are as at be by for from has have in is it its of on or that the this to was were will with what which who how does do can any shall may".split(" "),
);

export function tokenize(text: string): string[] {
  // \p{M} keeps vowel signs and viramas attached to their consonants in Indic scripts.
  return (text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []).filter((t) => t.length > 1 && !STOP.has(t));
}

type Doc = { section: Section; tf: Map<string, number>; len: number };

let indexed: { key: Section[]; docs: Doc[]; df: Map<string, number>; avg: number } | null = null;

function index(sections: Section[]) {
  if (indexed && indexed.key === sections) return indexed;
  const docs: Doc[] = sections.map((section) => {
    const toks = tokenize(`${section.section} ${section.title} ${section.title} ${section.text}`);
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { section, tf, len: toks.length };
  });
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const avg = docs.reduce((n, d) => n + d.len, 0) / Math.max(1, docs.length);
  indexed = { key: sections, docs, df, avg };
  return indexed;
}

export type Hit = { section: Section; score: number };

export function search(sections: Section[], query: string, k = 5): Hit[] {
  const { docs, df, avg } = index(sections);
  const terms = Array.from(new Set(tokenize(query)));
  const N = docs.length;
  const hits: Hit[] = [];
  for (const d of docs) {
    let score = 0;
    for (const t of terms) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / avg)));
    }
    if (score > 0) hits.push({ section: d.section, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, k);
}

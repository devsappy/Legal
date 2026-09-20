import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { loadCorpus } from "@/lib/rag/corpus";
import { getIndex, resetIndex } from "@/lib/rag/embeddings";

export const runtime = "nodejs";

/** Rebuilds the embedding index for the current corpus (no-op if unchanged). */
export async function POST() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;
  const started = Date.now();
  resetIndex();
  const sections = await loadCorpus();
  const index = await getIndex(sections);
  return NextResponse.json({
    ok: true,
    sections: sections.length,
    embedded: index?.ids.length ?? 0,
    seconds: Math.round((Date.now() - started) / 1000),
    note: index ? null : "embedding server not reachable; BM25 only",
  });
}

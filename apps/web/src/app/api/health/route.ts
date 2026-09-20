import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LLM_URL } from "@/lib/llm";
import { EMBED_URL } from "@/lib/rag/embeddings";
import { loadCorpus } from "@/lib/rag/corpus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness for the app plus reachability of the two model servers. */
export async function GET() {
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
  return NextResponse.json(
    { ok, database, llm, embed: embed === "ok" ? "ok" : `${embed} (BM25 only)`, corpusSections: corpus },
    { status: ok ? 200 : 503 },
  );
}

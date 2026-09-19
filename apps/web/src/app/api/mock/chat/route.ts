import { NextRequest } from "next/server";
import { MOCK_ANSWER, pick } from "@/lib/mock-data";
import type { ChatRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stand-in for POST /v1/chat on the FastAPI backend.
 * Emits the same SSE frames so the UI can be developed without Ollama running.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequest;
  const lang = body.language ?? "en";
  const text = pick(MOCK_ANSWER.text, lang);
  const lower = body.message.toLowerCase();
  const escalate = /dispute|complaint|deadline|शिकायत|विवाद|तक्रार|புகார்|தகராறு/.test(lower);

  const encoder = new TextEncoder();
  const frame = (event: string, data: unknown) =>
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      // Retrieval latency
      await sleep(600);
      controller.enqueue(
        frame("meta", {
          intent: escalate ? "escalate" : "informational",
          confidence: MOCK_ANSWER.confidence,
          language_detected: lang,
          escalate,
        }),
      );
      controller.enqueue(frame("citations", MOCK_ANSWER.citations));

      // Token stream, word by word
      const words = text.split(/(\s+)/);
      for (const w of words) {
        if (req.signal.aborted) break;
        controller.enqueue(frame("token", { text: w }));
        if (w.trim()) await sleep(18 + Math.random() * 30);
      }

      controller.enqueue(frame("done", { message_id: `mock-${Date.now()}` }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

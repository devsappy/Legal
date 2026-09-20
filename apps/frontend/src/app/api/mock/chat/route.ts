import { NextRequest } from "next/server";
import { MOCK_ANSWER, pick } from "@/lib/mock-data";
import type { ChatRequest } from "@sahayak/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The backend's timeout copy, verbatim, so the UI classifies it the same way. */
const TIMEOUT_COPY = "The answer took too long. Try a shorter question.";

type Failure = "timeout" | "429" | "401" | "500";

/**
 * Which failure to stage. `?fail=` is for curl; typing "/fail 429" (or
 * timeout, 401, 500) into the composer does the same from the UI.
 */
function failureOf(req: NextRequest, message: string): Failure | null {
  const fromQuery = req.nextUrl.searchParams.get("fail");
  const fromText = /^\/fail\s+(timeout|429|401|500)\b/i.exec(message.trim())?.[1];
  const raw = (fromQuery ?? fromText ?? "").toLowerCase();
  return raw === "timeout" || raw === "429" || raw === "401" || raw === "500" ? raw : null;
}

/**
 * Stand-in for POST /api/chat on the backend.
 * Emits the same SSE frames so the UI can be developed without Ollama running.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequest;
  const lang = body.language ?? "en";
  const text = pick(MOCK_ANSWER.text, lang);
  const message = body.message ?? "";
  const lower = message.toLowerCase();
  const escalate = /dispute|complaint|deadline|शिकायत|विवाद|तक्रार|புகார்|தகராறு/.test(lower);
  const fail = failureOf(req, message);

  if (fail === "401") return new Response("sign in first", { status: 401 });
  if (fail === "429") return new Response("too many requests", { status: 429, headers: { "Retry-After": "20" } });
  if (fail === "500") return new Response("model server unavailable", { status: 503 });

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

      if (fail === "timeout") {
        // A few words arrive, then the backend gives up the way it really does.
        const head = text.split(/(\s+)/).slice(0, 12);
        for (const w of head) {
          if (req.signal.aborted) break;
          controller.enqueue(frame("token", { text: w }));
          if (w.trim()) await sleep(40);
        }
        await sleep(900);
        controller.enqueue(frame("error", { message: TIMEOUT_COPY }));
        controller.close();
        return;
      }

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

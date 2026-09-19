import { NextRequest } from "next/server";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { chatJSON, streamChat, type Message } from "@/lib/llm";
import { sectionsFor } from "@/lib/rag/corpus";
import { confidenceOf, search } from "@/lib/rag/search";
import type { ChatRequest, Citation, Intent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * POST /api/chat — the real pipeline behind the Ask page.
 *   1. one small JSON call: language, intent, escalate, English search terms
 *   2. BM25 over the Act sections for the chosen jurisdiction (+ central)
 *   3. stream the grounded answer, citing sources by number
 * Emits the same SSE frames as the FastAPI contract in src/lib/types.ts.
 */

const LANG_NAME: Record<string, string> = { en: "English", hi: "Hindi", mr: "Marathi", ta: "Tamil" };

type Analysis = {
  language_detected: "en" | "hi" | "mr" | "ta" | "other";
  intent: Intent;
  escalate: boolean;
  search_terms: string;
};

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    language_detected: { type: "string", enum: ["en", "hi", "mr", "ta", "other"] },
    intent: { type: "string", enum: ["informational", "procedural", "out_of_scope", "escalate"] },
    escalate: { type: "boolean" },
    search_terms: { type: "string" },
  },
  required: ["language_detected", "intent", "escalate", "search_terms"],
  additionalProperties: false,
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequest;
  const question = (body.message ?? "").trim();
  const jurisdiction = JURISDICTIONS.find((j) => j.id === body.jurisdiction) ?? JURISDICTIONS[0];
  const uiLang = LANGUAGES.some((l) => l.code === body.language) ? body.language : "en";

  const encoder = new TextEncoder();
  const frame = (event: string, data: unknown) => encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(frame(event, data));
      try {
        // 1 · understand the question
        const analysis = await chatJSON<Analysis>(
          [
            {
              role: "system",
              content:
                "You triage questions for an assistant on Indian cooperative-society law. " +
                "Detect the language of the question (en, hi, mr, ta or other). " +
                "intent: informational (what the law says), procedural (how to do something), escalate (a live dispute, complaint, deadline, penalty or court matter), out_of_scope (not about cooperative societies). " +
                "escalate is true when acting on the answer without the Registrar or a lawyer could harm the user. " +
                "search_terms: 4-10 English legal keywords that would find the relevant section of a Cooperative Societies Act (e.g. 'annual general meeting quorum notice').",
            },
            { role: "user", content: question },
          ],
          ANALYSIS_SCHEMA,
          req.signal,
        );
        const answerLang = analysis.language_detected !== "other" ? analysis.language_detected : uiLang;

        // 2 · find the sections
        const sections = await sectionsFor(jurisdiction.id);
        const hits = search(sections, `${analysis.search_terms} ${question}`, 5);
        const citations: Citation[] = hits.map((h, i) => ({
          id: i + 1,
          act: h.section.act,
          section: h.section.section,
          title: h.section.title,
          excerpt: h.section.text.replace(/\s+/g, " ").slice(0, 320),
          jurisdiction: h.section.jurisdiction,
          verified: true, // straight from the indexed corpus
        }));

        send("meta", {
          intent: analysis.intent,
          confidence: analysis.intent === "out_of_scope" ? 0.2 : confidenceOf(hits),
          language_detected: answerLang,
          escalate: analysis.escalate || analysis.intent === "escalate",
        });
        send("citations", citations);

        // 3 · answer from the sources only
        const sourceBlock = citations.length
          ? citations.map((c, i) => `[${i + 1}] ${c.act} — ${c.section} ${c.title}\n${hits[i].section.text}`).join("\n\n")
          : "(no matching sections were found in the indexed corpus)";
        const messages: Message[] = [
          {
            role: "system",
            content:
              `You are Sahayak, an assistant on Indian cooperative-society law. Answer in ${LANG_NAME[answerLang] ?? "English"}, in that language's own script. ` +
              "Use ONLY the numbered sources provided. After each sentence that relies on a source, cite it as its number in square brackets, e.g. [2]. " +
              "If the sources do not cover the question, say so plainly and point the user to the Act or the Registrar's office — never invent section numbers or figures. " +
              "Be concise: two to four short paragraphs, no headings. Describe what the law says; do not give personal legal advice.",
          },
          {
            role: "user",
            content: `Jurisdiction: ${jurisdiction.act}\n\nQuestion: ${question}\n\nSources:\n${sourceBlock}`,
          },
        ];
        for await (const text of streamChat(messages, req.signal)) {
          if (req.signal.aborted) break;
          send("token", { text });
        }
        send("done", { message_id: `local-${Date.now().toString(36)}` });
      } catch (err) {
        if (!req.signal.aborted) send("error", { message: (err as Error).message });
      } finally {
        controller.close();
      }
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

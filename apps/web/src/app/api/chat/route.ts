import { NextRequest } from "next/server";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { chatJSON, streamChat, type Message } from "@/lib/llm";
import { sectionsFor } from "@/lib/rag/corpus";
import { confidenceOf, retrieve } from "@/lib/rag/retrieve";
import type { ChatRequest, Citation, Intent } from "@/lib/types";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { allow, clientKey } from "@/lib/ratelimit";

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
const SOURCE_CHARS = 3200;

/** Cuts long section text at a sentence boundary near the limit. */
function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"), cut.lastIndexOf(";"));
  return `${cut.slice(0, end > max * 0.6 ? end + 1 : max)} […]`;
}

/* Words that mean a real dispute or deadline is in play; these force the
   escalation notice regardless of what the triage model decided. */
const ESCALATE_WORDS =
  /dispute|complaint|deadline|penalty|arbitration|court|notice period|शिकायत|विवाद|समय-सीमा|जुर्माना|तक्रार|वाद|मुदत|दंड|புகார்|தகராறு|காலக்கெடு|அபராதம்/i;

type Analysis = {
  language_detected: "en" | "hi" | "mr" | "ta" | "other";
  intent: Intent;
  escalate: boolean;
  search_terms: string;
};

/** After the answer: which cited sources actually support the sentences that cite them. */
type Support = { checks: { id: number; supported: boolean }[] };
const SUPPORT_SCHEMA = {
  type: "object",
  properties: {
    checks: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "integer" }, supported: { type: "boolean" } },
        required: ["id", "supported"],
        additionalProperties: false,
      },
    },
  },
  required: ["checks"],
  additionalProperties: false,
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

const RATE_LIMIT = Number(process.env.CHAT_RATE_LIMIT ?? 30); // per 10 minutes per client
const TIMEOUT_MS = Number(process.env.CHAT_TIMEOUT_MS ?? 150_000);

export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return new Response("sign in first", { status: 401 });
  const gate = allow(clientKey(req), RATE_LIMIT);
  if (!gate.ok) return new Response("too many requests", { status: 429, headers: { "Retry-After": String(gate.retryAfter) } });
  // The whole pipeline stops when the client leaves or the budget runs out.
  const signal = AbortSignal.any([req.signal, AbortSignal.timeout(TIMEOUT_MS)]);

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
          signal,
        );
        const answerLang = analysis.language_detected !== "other" ? analysis.language_detected : uiLang;

        // 2 · find the sections
        const sections = await sectionsFor(jurisdiction.id);
        const hits = await retrieve(sections, `${analysis.search_terms} ${question}`, question, jurisdiction.id, 5);
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
          escalate: analysis.escalate || analysis.intent === "escalate" || ESCALATE_WORDS.test(question),
        });
        send("citations", citations);

        // 3 · answer from the sources only
        // Keep the prompt inside the model's context: ~1k tokens per source, ~4k in total.
        const sourceBlock = citations.length
          ? citations.map((c, i) => `[${i + 1}] ${c.act} — ${c.section} ${c.title}\n${clip(hits[i].section.text, SOURCE_CHARS)}`).join("\n\n")
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
        let answer = "";
        for await (const text of streamChat(messages, signal)) {
          if (signal.aborted) break;
          answer += text;
          send("token", { text });
        }

        // 4 · verify: keep only the sources the answer cites, check each supports its sentences
        const used = new Set([...answer.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])));
        const invented = [...used].filter((n) => n < 1 || n > citations.length).length;
        let cited = citations.filter((c) => used.has(c.id));
        if (cited.length && !signal.aborted) {
          try {
            const verdict = await chatJSON<Support>(
              [
                {
                  role: "system",
                  content:
                    "You check citations. For each source number, decide whether the source text supports the sentences of the answer that cite that number. " +
                    "Return supported=false when the answer claims something the source does not say.",
                },
                {
                  role: "user",
                  content: [
                    "Answer:",
                    answer,
                    "",
                    "Sources:",
                    cited.map((c) => `[${c.id}] ${clip(hits[c.id - 1].section.text, 2200)}`).join("\n\n"),
                  ].join("\n"),
                },
              ],
              SUPPORT_SCHEMA,
              AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
            );
            const ok = new Map(verdict.checks.map((c) => [c.id, c.supported]));
            cited = cited.map((c) => ({ ...c, verified: ok.get(c.id) ?? true }));
          } catch {
            /* the existence check already passed; leave verified as is */
          }
        }
        send("citations", cited);
        const base = analysis.intent === "out_of_scope" ? 0.2 : confidenceOf(hits);
        const unsupported = cited.filter((c) => !c.verified).length;
        send("meta", {
          intent: analysis.intent,
          confidence: Math.max(0.1, base - 0.2 * invented - 0.15 * unsupported),
          language_detected: answerLang,
          escalate: analysis.escalate || analysis.intent === "escalate" || ESCALATE_WORDS.test(question),
        });
        const finalConfidence = Math.max(0.1, base - 0.2 * invented - 0.15 * unsupported);
        if (analysis.intent !== "out_of_scope" && (finalConfidence < 0.55 || cited.length === 0)) {
          try {
            db()
              .prepare("INSERT INTO reviews (question, answer, language, jurisdiction, confidence, reason) VALUES (?, ?, ?, ?, ?, ?)")
              .run(question, answer, answerLang, jurisdiction.id, finalConfidence, cited.length === 0 ? "no_citation" : "low_confidence");
          } catch {
            /* the review queue is best effort */
          }
        }
        send("done", { message_id: `local-${Date.now().toString(36)}` });
      } catch (err) {
        if (!req.signal.aborted) send("error", { message: signal.aborted ? "The answer took too long. Try a shorter question." : (err as Error).message });
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

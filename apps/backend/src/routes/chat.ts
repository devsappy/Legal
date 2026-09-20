import { Hono } from "hono";
import { JURISDICTIONS, LANGUAGES, type ChatRequest, type Citation, type Intent } from "@sahayak/shared";
import { chatJSON, streamChat, type Message } from "../lib/llm";
import { sectionsFor } from "../lib/rag/corpus";
import { confidenceOf, retrieve } from "../lib/rag/retrieve";
import { db } from "../lib/db";
import { currentUser, requireUser } from "../lib/admin";
import { allow, clientKey } from "../lib/ratelimit";

/*
 * POST /api/chat — the pipeline behind the Ask page.
 *   1. one small JSON call: language, intent, escalate, English search terms
 *   2. hybrid retrieval over the Act sections for the chosen jurisdiction (+ central)
 *   3. stream the grounded answer, citing sources by number
 *   4. keep only cited sources, check each supports its sentences, re-emit
 * Emits SSE frames: meta, citations, token, done, error (see @sahayak/shared).
 */
export const chat = new Hono();

const LANG_NAME: Record<string, string> = { en: "English", hi: "Hindi", mr: "Marathi", ta: "Tamil" };
const SOURCE_CHARS = 3200;
const RATE_LIMIT = Number(process.env.CHAT_RATE_LIMIT ?? 30); // per 10 minutes per client
const TIMEOUT_MS = Number(process.env.CHAT_TIMEOUT_MS ?? 150_000);

/* Words that mean a real dispute or deadline is in play; these force the
   escalation notice regardless of what the triage model decided. */
const ESCALATE_WORDS =
  /dispute|complaint|deadline|penalty|arbitration|court|notice period|शिकायत|विवाद|समय-सीमा|जुर्माना|तक्रार|वाद|मुदत|दंड|புகார்|தகராறு|காலக்கெடு|அபராதம்/i;

/** Cuts long section text at a sentence boundary near the limit. */
function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"), cut.lastIndexOf(";"));
  return `${cut.slice(0, end > max * 0.6 ? end + 1 : max)} […]`;
}

type Analysis = { language_detected: "en" | "hi" | "mr" | "ta" | "other"; intent: Intent; escalate: boolean; search_terms: string };
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

type Support = { checks: { id: number; supported: boolean }[] };
const SUPPORT_SCHEMA = {
  type: "object",
  properties: {
    checks: {
      type: "array",
      items: { type: "object", properties: { id: { type: "integer" }, supported: { type: "boolean" } }, required: ["id", "supported"], additionalProperties: false },
    },
  },
  required: ["checks"],
  additionalProperties: false,
};
const USED_SCHEMA = { type: "object", properties: { used: { type: "array", items: { type: "integer" } } }, required: ["used"], additionalProperties: false };

chat.post("/", async (c) => {
  if (!currentUser(c)) return c.text("sign in first", 401);
  const gate = allow(clientKey(c.req.raw), RATE_LIMIT);
  if (!gate.ok) return c.text("too many requests", 429, { "Retry-After": String(gate.retryAfter) });
  const signal = AbortSignal.any([c.req.raw.signal, AbortSignal.timeout(TIMEOUT_MS)]);

  const body = (await c.req.json()) as ChatRequest;
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

        // 2 · find the sections. Both signals see the English search terms: bge-m3 is far
        // stronger English→English than Marathi→English, and the terms carry the legal
        // vocabulary the question lacks.
        const sections = await sectionsFor(jurisdiction.id);
        const hits = await retrieve(sections, `${analysis.search_terms} ${question}`, `${analysis.search_terms}. ${question}`, jurisdiction.id, 5);
        const citations: Citation[] = hits.map((h, i) => ({
          id: i + 1,
          act: h.section.act,
          section: h.section.section,
          title: h.section.title,
          excerpt: h.section.text.replace(/\s+/g, " ").slice(0, 320),
          jurisdiction: h.section.jurisdiction,
          verified: true, // straight from the indexed corpus
        }));
        const escalate = analysis.escalate || analysis.intent === "escalate" || ESCALATE_WORDS.test(question);
        const base = analysis.intent === "out_of_scope" ? 0.2 : confidenceOf(hits);

        send("meta", { intent: analysis.intent, confidence: base, language_detected: answerLang, escalate });
        send("citations", citations);

        // 3 · answer from the sources only (~1k tokens per source keeps the prompt in context)
        const sourceBlock = citations.length
          ? citations.map((ct, i) => `[${i + 1}] ${ct.act} — ${ct.section} ${ct.title}\n${clip(hits[i].section.text, SOURCE_CHARS)}`).join("\n\n")
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
          { role: "user", content: `Jurisdiction: ${jurisdiction.act}\n\nQuestion: ${question}\n\nSources:\n${sourceBlock}` },
        ];
        let answer = "";
        for await (const text of streamChat(messages, signal)) {
          if (signal.aborted) break;
          answer += text;
          send("token", { text });
        }

        // 4 · verify
        const used = new Set([...answer.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])));
        // Small models sometimes answer from the sources but forget the [n] markers,
        // most often in Marathi. Ask once which sources the answer drew on.
        if (used.size === 0 && citations.length && answer.length > 80 && !signal.aborted) {
          try {
            const attributed = await chatJSON<{ used: number[] }>(
              [
                { role: "system", content: "Given an answer and numbered sources, list the numbers of the sources the answer's statements come from. Return an empty list if the answer does not rely on any of them." },
                {
                  role: "user",
                  content: ["Answer:", answer, "", "Sources:", citations.map((ct) => `[${ct.id}] ${ct.act} ${ct.section} ${ct.title}: ${clip(hits[ct.id - 1].section.text, 900)}`).join("\n\n")].join("\n"),
                },
              ],
              USED_SCHEMA,
              AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
            );
            for (const n of attributed.used) if (n >= 1 && n <= citations.length) used.add(n);
          } catch {
            /* leave the answer uncited; it will be queued for review */
          }
        }
        const invented = [...used].filter((n) => n < 1 || n > citations.length).length;
        let cited = citations.filter((ct) => used.has(ct.id));
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
                { role: "user", content: ["Answer:", answer, "", "Sources:", cited.map((ct) => `[${ct.id}] ${clip(hits[ct.id - 1].section.text, 2200)}`).join("\n\n")].join("\n") },
              ],
              SUPPORT_SCHEMA,
              AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
            );
            const ok = new Map(verdict.checks.map((k) => [k.id, k.supported]));
            cited = cited.map((ct) => ({ ...ct, verified: ok.get(ct.id) ?? true }));
          } catch {
            /* the existence check already passed; leave verified as is */
          }
        }
        send("citations", cited);
        const unsupported = cited.filter((ct) => !ct.verified).length;
        const finalConfidence = Math.max(0.1, base - 0.2 * invented - 0.15 * unsupported);
        send("meta", { intent: analysis.intent, confidence: finalConfidence, language_detected: answerLang, escalate });

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
        if (!c.req.raw.signal.aborted) {
          send("error", { message: signal.aborted ? "The answer took too long. Try a shorter question." : (err as Error).message });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
});

/** Thumbs up/down. A thumbs-down also opens a review item. */
chat.post("/:id/feedback", async (c) => {
  const gate = requireUser(c);
  if ("response" in gate) return gate.response;
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as {
    value?: "up" | "down";
    note?: string;
    question?: string;
    answer?: string;
    language?: string;
    jurisdiction?: string;
  };
  if (body.value !== "up" && body.value !== "down") return c.json({ ok: false }, 400);
  const d = db();
  d.prepare("INSERT INTO feedback (message_id, user_id, value, note) VALUES (?, ?, ?, ?)").run(id, gate.user.id, body.value, body.note ?? null);
  if (body.value === "down" && body.question) {
    d.prepare("INSERT INTO reviews (question, answer, language, jurisdiction, confidence, reason) VALUES (?, ?, ?, ?, ?, 'thumbs_down')").run(
      body.question,
      body.answer ?? "",
      body.language ?? "en",
      body.jurisdiction ?? "central",
      0,
    );
  }
  return c.json({ ok: true });
});

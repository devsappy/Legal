/**
 * Thin client for the llama.cpp server's OpenAI-compatible API.
 * Start it with `npm run llm` (see scripts/llm.ps1); LLM_URL / LLM_MODEL
 * point elsewhere if you host it differently.
 */
export const LLM_URL = (process.env.LLM_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
export const LLM_MODEL = process.env.LLM_MODEL ?? "sahayak";
export const LLM_API_KEY = process.env.LLM_API_KEY;

export type Message = { role: "system" | "user" | "assistant"; content: string };

export class LlmUnavailable extends Error {
  constructor(cause: unknown) {
    super(`LLM server not reachable at ${LLM_URL} — start it with \`npm run llm\`. (${(cause as Error)?.message ?? cause})`);
    this.name = "LlmUnavailable";
  }
}

async function post(body: unknown, signal?: AbortSignal): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${LLM_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(LLM_API_KEY ? { Authorization: `Bearer ${LLM_API_KEY}` } : {}) },
      body: JSON.stringify({ model: LLM_MODEL, ...(body as object) }),
      signal,
    });
  } catch (err) {
    throw new LlmUnavailable(err);
  }
  if (!res.ok) throw new Error(`LLM request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return res;
}

/** One non-streaming call constrained to a JSON schema (llama.cpp grammar-enforced). */
export async function chatJSON<T>(messages: Message[], schema: object, signal?: AbortSignal): Promise<T> {
  const res = await post(
    {
      messages,
      temperature: 0.1,
      max_tokens: 400,
      response_format: { type: "json_schema", json_schema: { name: "out", schema, strict: true } },
    },
    signal,
  );
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return JSON.parse(data.choices[0].message.content) as T;
}

/** Streams the assistant's text deltas. */
export async function* streamChat(messages: Message[], signal?: AbortSignal): AsyncGenerator<string> {
  const res = await post({ messages, stream: true, temperature: 0.4, top_p: 0.9, max_tokens: 900 }, signal);
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
          const text = json.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch {
          /* keep-alive or partial frame */
        }
      }
    }
  }
}

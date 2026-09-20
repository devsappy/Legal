import { CHAT_ENDPOINT } from "./config";
import { ChatError, chatErrorFromResponse, chatErrorFromStreamMessage, chatErrorFromUnknown, isChatError } from "./chat-error";
import type { ChatRequest, StreamEvent } from "./types";

/**
 * Opens a streaming chat request and yields parsed SSE events.
 * Works against the backend (through the /api proxy or NEXT_PUBLIC_API_URL) and the mock route alike.
 *
 * Failures surface as ChatError: a 401 (session ended), a 429 with its
 * Retry-After, a 5xx, a fetch that never reached the server, or the
 * backend's own `event: error` frame (a timeout when its text says so).
 * An abort by the caller's signal is re-thrown untouched (AbortError).
 */
export async function* streamChat(
  body: ChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  let res: Response;
  try {
    res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(body),
      credentials: "include",
      signal,
    });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") throw err;
    throw chatErrorFromUnknown(err);
  }

  if (!res.ok) {
    let text: string | undefined;
    try {
      text = await res.text();
    } catch {
      text = undefined;
    }
    throw chatErrorFromResponse(res, text);
  }
  if (!res.body) throw new ChatError("server", `Chat request returned no body (${res.status})`, { status: res.status });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const parsed = parseFrame(frame);
        if (!parsed) continue;
        if (parsed.event === "error") throw chatErrorFromStreamMessage(parsed.data?.message);
        yield parsed;
      }
    }
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError" || isChatError(err)) throw err;
    // The connection dropped mid-stream (proxy restart, backend killed).
    throw chatErrorFromUnknown(err);
  }
}

export function parseFrame(frame: string): StreamEvent | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) } as StreamEvent;
  } catch {
    return null;
  }
}

export type FeedbackContext = { question?: string; answer?: string; language?: string; jurisdiction?: string; note?: string };

/** Thumbs up/down (plus an optional note) for one answer. Resolves false when the server did not take it. */
export async function sendFeedback(messageId: string, value: "up" | "down", context: FeedbackContext = {}): Promise<boolean> {
  if (CHAT_ENDPOINT.startsWith("/api/mock")) return true;
  try {
    const res = await fetch(`${CHAT_ENDPOINT}/${encodeURIComponent(messageId)}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, ...context }),
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

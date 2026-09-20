import { afterEach, describe, expect, it, vi } from "vitest";
import { parseFrame, streamChat } from "@/lib/api";
import { ChatError } from "@/lib/chat-error";
import type { StreamEvent } from "@/lib/types";

describe("SSE frame parsing", () => {
  it("reads event and JSON data lines", () => {
    expect(parseFrame('event: token\ndata: {"text":"Hello"}')).toEqual({ event: "token", data: { text: "Hello" } });
  });
  it("joins multi-line data", () => {
    expect(parseFrame('event: meta\ndata: {"intent":\ndata: "procedural"}')).toEqual({
      event: "meta",
      data: { intent: "procedural" },
    });
  });
  it("ignores comments and malformed frames", () => {
    expect(parseFrame(": keep-alive")).toBeNull();
    expect(parseFrame("event: token\ndata: {not json")).toBeNull();
  });
});

/* ---- streamChat: responses and frames become typed ChatErrors ---- */

const REQUEST = { session_id: "s", message: "hi", language: "en", jurisdiction: "central" };

function sse(frames: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const f of frames) controller.enqueue(encoder.encode(f));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

async function collect(gen: AsyncGenerator<StreamEvent>): Promise<{ events: StreamEvent[]; error: unknown }> {
  const events: StreamEvent[] = [];
  try {
    for await (const ev of gen) events.push(ev);
    return { events, error: null };
  } catch (error) {
    return { events, error };
  }
}

describe("streamChat error classification", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("yields parsed events and stops at the end of the stream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sse(['event: token\ndata: {"text":"Hel"}\n\n', 'event: token\ndata: {"text":"lo"}\n\nevent: done\ndata: {"message_id":"m1"}\n\n']),
      ),
    );
    const { events, error } = await collect(streamChat(REQUEST));
    expect(error).toBeNull();
    expect(events.map((e) => e.event)).toEqual(["token", "token", "done"]);
  });

  it("throws unauthorized on a 401", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("sign in first", { status: 401 })));
    const { error } = await collect(streamChat(REQUEST));
    expect(error).toBeInstanceOf(ChatError);
    expect((error as ChatError).kind).toBe("unauthorized");
  });

  it("throws rate_limited with Retry-After on a 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("too many requests", { status: 429, headers: { "Retry-After": "20" } })),
    );
    const { error } = await collect(streamChat(REQUEST));
    expect((error as ChatError).kind).toBe("rate_limited");
    expect((error as ChatError).retryAfter).toBe(20);
  });

  it("throws server on a 5xx", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    const { error } = await collect(streamChat(REQUEST));
    expect((error as ChatError).kind).toBe("server");
    expect((error as ChatError).status).toBe(503);
  });

  it("throws network when fetch itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    const { error } = await collect(streamChat(REQUEST));
    expect((error as ChatError).kind).toBe("network");
  });

  it("turns the backend's timeout error frame into a timeout after the earlier events", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sse([
          'event: meta\ndata: {"intent":"informational","confidence":0.8,"language_detected":"en","escalate":false}\n\n',
          'event: token\ndata: {"text":"Partial"}\n\n',
          'event: error\ndata: {"message":"The answer took too long. Try a shorter question."}\n\n',
        ]),
      ),
    );
    const { events, error } = await collect(streamChat(REQUEST));
    expect(events.map((e) => e.event)).toEqual(["meta", "token"]);
    expect((error as ChatError).kind).toBe("timeout");
  });

  it("turns any other error frame into a server error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sse(['event: error\ndata: {"message":"model crashed"}\n\n'])));
    const { error } = await collect(streamChat(REQUEST));
    expect((error as ChatError).kind).toBe("server");
    expect((error as ChatError).message).toBe("model crashed");
  });

  it("re-throws an abort untouched", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        controller.abort();
        const err = new Error("aborted");
        err.name = "AbortError";
        if (init?.signal?.aborted) throw err;
        return sse([]);
      }),
    );
    const { error } = await collect(streamChat(REQUEST, controller.signal));
    expect((error as Error).name).toBe("AbortError");
    expect(error).not.toBeInstanceOf(ChatError);
  });
});

import { describe, expect, it } from "vitest";
import {
  ChatError,
  chatErrorFromResponse,
  chatErrorFromStreamMessage,
  chatErrorFromUnknown,
  isChatError,
  parseRetryAfter,
  retryRemaining,
} from "@/lib/chat-error";

const response = (status: number, headers: Record<string, string> = {}) => ({
  status,
  headers: { get: (name: string) => headers[name] ?? headers[name.toLowerCase()] ?? null },
});

describe("ChatError classification", () => {
  it("maps 401 to unauthorized with the body text", () => {
    const err = chatErrorFromResponse(response(401), "sign in first");
    expect(err).toBeInstanceOf(ChatError);
    expect(err.kind).toBe("unauthorized");
    expect(err.status).toBe(401);
    expect(err.message).toBe("sign in first");
  });

  it("maps 429 to rate_limited and reads Retry-After seconds", () => {
    const err = chatErrorFromResponse(response(429, { "Retry-After": "20" }), "too many requests");
    expect(err.kind).toBe("rate_limited");
    expect(err.retryAfter).toBe(20);
  });

  it("reads an HTTP-date Retry-After", () => {
    const now = Date.parse("2026-09-20T10:00:00Z");
    expect(parseRetryAfter("Sun, 20 Sep 2026 10:00:30 GMT", now)).toBe(30);
    expect(parseRetryAfter("Sun, 20 Sep 2026 09:59:00 GMT", now)).toBe(0);
    expect(parseRetryAfter("garbage", now)).toBeUndefined();
    expect(parseRetryAfter(null)).toBeUndefined();
  });

  it("maps 5xx (and 4xx that are not auth/limit) to server", () => {
    expect(chatErrorFromResponse(response(503)).kind).toBe("server");
    expect(chatErrorFromResponse(response(500)).kind).toBe("server");
    expect(chatErrorFromResponse(response(400)).kind).toBe("server");
    expect(chatErrorFromResponse(response(504)).kind).toBe("timeout");
  });

  it("recognises the backend's timeout copy in an error frame", () => {
    const err = chatErrorFromStreamMessage("The answer took too long. Try a shorter question.");
    expect(err.kind).toBe("timeout");
    expect(chatErrorFromStreamMessage("model crashed").kind).toBe("server");
    expect(chatErrorFromStreamMessage(undefined).kind).toBe("server");
  });

  it("treats a failed fetch as a network error and passes ChatErrors through", () => {
    const net = chatErrorFromUnknown(new TypeError("Failed to fetch"));
    expect(net.kind).toBe("network");
    const original = new ChatError("rate_limited", "x", { retryAfter: 5 });
    expect(chatErrorFromUnknown(original)).toBe(original);
    expect(chatErrorFromUnknown({ name: "TimeoutError", message: "signal timed out" }).kind).toBe("timeout");
    expect(chatErrorFromUnknown("boom").kind).toBe("server");
    expect(isChatError(new Error("plain"))).toBe(false);
  });

  it("serialises to the stored info shape", () => {
    const info = new ChatError("rate_limited", "too many requests", { retryAfter: 20 }).toInfo(1000);
    expect(info).toEqual({ kind: "rate_limited", at: 1000, retryAfter: 20, message: "too many requests" });
    // The kind used as a placeholder message is not copied.
    expect(new ChatError("network").toInfo(1).message).toBeUndefined();
  });

  it("counts down a rate limit from when it happened", () => {
    const info = { kind: "rate_limited" as const, retryAfter: 20, at: 10_000 };
    expect(retryRemaining(info, 0, 10_000)).toBe(20);
    expect(retryRemaining(info, 0, 25_500)).toBe(5);
    expect(retryRemaining(info, 0, 40_000)).toBe(0);
    // Falls back to the message's createdAt when `at` is missing.
    expect(retryRemaining({ kind: "rate_limited", retryAfter: 10 }, 10_000, 12_000)).toBe(8);
    expect(retryRemaining({ kind: "server" }, 0, 0)).toBe(0);
    expect(retryRemaining(undefined, 0, 0)).toBe(0);
  });
});

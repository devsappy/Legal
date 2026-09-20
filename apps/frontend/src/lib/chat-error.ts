import type { ChatErrorInfo, ChatErrorKind } from "@sahayak/shared";

export type { ChatErrorInfo, ChatErrorKind };

/**
 * The backend's own timeout copy (apps/backend/src/routes/chat.ts). An error
 * frame whose text matches is a timeout, not a generic failure.
 */
export const TIMEOUT_PATTERN = /took too long|timed out|timeout/i;

/**
 * A failed chat request, typed by cause so the transcript can show the right
 * card: sign in again, wait out a rate limit, shorten the question, check the
 * service, or just try again.
 */
export class ChatError extends Error {
  readonly kind: ChatErrorKind;
  /** Seconds to wait before retrying (from a 429's Retry-After). */
  readonly retryAfter?: number;
  /** HTTP status when the failure was a response. */
  readonly status?: number;

  constructor(kind: ChatErrorKind, message?: string, opts: { retryAfter?: number; status?: number; cause?: unknown } = {}) {
    super(message ?? kind, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = "ChatError";
    this.kind = kind;
    if (opts.retryAfter !== undefined) this.retryAfter = opts.retryAfter;
    if (opts.status !== undefined) this.status = opts.status;
  }

  /** The serialisable shape stored on ChatMessage.context.error. */
  toInfo(at = Date.now()): ChatErrorInfo {
    const info: ChatErrorInfo = { kind: this.kind, at };
    if (this.retryAfter !== undefined) info.retryAfter = this.retryAfter;
    // The generic kind is the only one whose message is not already covered by UI copy.
    if (this.message && this.message !== this.kind) info.message = this.message;
    return info;
  }
}

export function isChatError(err: unknown): err is ChatError {
  return err instanceof ChatError || (typeof err === "object" && err !== null && (err as { name?: string }).name === "ChatError");
}

/**
 * Retry-After is either delta-seconds or an HTTP date. Returns whole seconds,
 * never negative; undefined when the header is missing or unreadable.
 */
export function parseRetryAfter(header: string | null | undefined, now = Date.now()): number | undefined {
  if (header === null || header === undefined) return undefined;
  const text = header.trim();
  if (!text) return undefined;
  if (/^\d+$/.test(text)) return Number(text);
  const date = Date.parse(text);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, Math.ceil((date - now) / 1000));
}

/** Classifies a non-OK response: 401, 429 (+ Retry-After), everything else is the server's fault. */
export function chatErrorFromResponse(res: { status: number; headers?: { get(name: string): string | null } }, bodyText?: string): ChatError {
  const message = bodyText?.trim() || undefined;
  if (res.status === 401 || res.status === 403) return new ChatError("unauthorized", message, { status: res.status });
  if (res.status === 429) {
    return new ChatError("rate_limited", message, { status: 429, retryAfter: parseRetryAfter(res.headers?.get("Retry-After")) });
  }
  if (res.status === 408 || res.status === 504) return new ChatError("timeout", message, { status: res.status });
  return new ChatError("server", message, { status: res.status });
}

/** Classifies the text of an `event: error` SSE frame. */
export function chatErrorFromStreamMessage(message: string | undefined): ChatError {
  const text = (message ?? "").trim();
  if (TIMEOUT_PATTERN.test(text)) return new ChatError("timeout", text);
  return new ChatError("server", text || undefined);
}

/**
 * Anything thrown while streaming becomes a ChatError. A fetch that never
 * reached the server (TypeError "Failed to fetch", "Load failed", "fetch
 * failed") is a network failure; an AbortError is not an error at all and is
 * left for the caller to recognise.
 */
export function chatErrorFromUnknown(err: unknown): ChatError {
  if (isChatError(err)) return err as ChatError;
  if (err instanceof TypeError) return new ChatError("network", err.message, { cause: err });
  if (typeof err === "object" && err !== null) {
    const e = err as { name?: string; message?: string; code?: string };
    if (e.name === "TypeError" || e.code === "ECONNREFUSED" || e.code === "ENOTFOUND") {
      return new ChatError("network", e.message, { cause: err });
    }
    if (e.name === "TimeoutError") return new ChatError("timeout", e.message, { cause: err });
    return new ChatError("server", e.message, { cause: err });
  }
  return new ChatError("server", typeof err === "string" ? err : undefined, { cause: err });
}

/** Seconds left on a rate limit, from the stored error info; 0 when it has passed. */
export function retryRemaining(info: ChatErrorInfo | undefined, fallbackAt: number, now = Date.now()): number {
  if (!info || info.kind !== "rate_limited" || !info.retryAfter) return 0;
  const deadline = (info.at ?? fallbackAt) + info.retryAfter * 1000;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

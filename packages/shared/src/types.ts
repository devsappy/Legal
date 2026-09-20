/* ---- chat ---- */
export type Role = "user" | "assistant";

export type Citation = {
  id: number;
  act: string;
  section: string;
  title: string;
  excerpt: string;
  jurisdiction: string;
  /** True when the backend confirmed this section supports the sentences citing it. */
  verified: boolean;
};

export type Intent = "informational" | "procedural" | "out_of_scope" | "escalate";

export type MessageMeta = {
  intent?: Intent;
  confidence?: number;
  languageDetected?: string;
  escalate?: boolean;
};

/** Why an answer failed; the UI renders a different card per kind. */
export type ChatErrorKind = "unauthorized" | "rate_limited" | "timeout" | "server" | "network";

export type ChatErrorInfo = {
  kind: ChatErrorKind;
  /** Seconds to wait before trying again (429 Retry-After). */
  retryAfter?: number;
  /** The backend's own words, when it sent any. */
  message?: string;
  /** When the failure happened, so a countdown survives a reload. */
  at?: number;
};

/** What the assistant was asked to answer from, stamped on both turns of a send. */
export type MessageContext = {
  jurisdiction: string;
  language: string;
  /** Wall-clock time from send to the last frame (done, stopped or failed). */
  durationMs?: number;
  error?: ChatErrorInfo;
};

export type ChatMessage = {
  id: string;
  role: Role;
  text: string;
  citations: Citation[];
  meta?: MessageMeta;
  status: "streaming" | "done" | "error" | "stopped";
  createdAt: number;
  feedback?: "up" | "down";
  /** Absent on messages saved before contexts were recorded. */
  context?: MessageContext;
};

export type ChatRequest = {
  session_id: string;
  message: string;
  language: string;
  jurisdiction: string;
};

/** Server-sent events emitted by POST /api/chat */
export type StreamEvent =
  | { event: "token"; data: { text: string } }
  | { event: "citations"; data: Citation[] }
  | { event: "meta"; data: { intent: Intent; confidence: number; language_detected: string; escalate: boolean } }
  | { event: "done"; data: { message_id: string } }
  | { event: "error"; data: { message: string } };

/* ---- accounts ---- */
export type UserRole = "member" | "admin";
export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  /** ISO timestamp of the account's creation, when the backend includes it. */
  createdAt?: string;
};

/* ---- procedures ---- */
/** Text with per-locale variants; falls back to English. */
export type L = { en: string; hi?: string; mr?: string; ta?: string };

export function pick(text: L, locale: string): string {
  return (text as Record<string, string | undefined>)[locale] ?? text.en;
}

export type ChecklistStep = { title: L; detail: L; forms?: string[]; deadline?: L; fee?: L };

export type Checklist = {
  slug: string;
  title: L;
  summary: L;
  authority: L;
  basis: string[];
  jurisdiction: string;
  steps: ChecklistStep[];
};

/* ---- admin ---- */
export type GlossaryRow = { id: number; term: string; hi: string; mr: string; ta: string; source: string };

export type ReviewRow = {
  id: number;
  question: string;
  answer: string;
  language: string;
  jurisdiction: string;
  confidence: number;
  reason: "low_confidence" | "thumbs_down" | "no_citation";
  status: "open" | "resolved";
  created_at: string;
};

export type DocumentRow = { file: string; title: string; jurisdiction: string; sections: number; updated: string; untitled: number };

export type Conversation = { id: string; title: string; updatedAt: number; messages: ChatMessage[] };

export type Role = "user" | "assistant";

export type Citation = {
  id: number;
  act: string;
  section: string;
  title: string;
  excerpt: string;
  jurisdiction: string;
  /** True when the backend confirmed this section exists in the indexed corpus. */
  verified: boolean;
};

export type Intent = "informational" | "procedural" | "out_of_scope" | "escalate";

export type MessageMeta = {
  intent?: Intent;
  confidence?: number;
  languageDetected?: string;
  escalate?: boolean;
};

export type ChatMessage = {
  id: string;
  role: Role;
  text: string;
  citations: Citation[];
  meta?: MessageMeta;
  status: "streaming" | "done" | "error";
  createdAt: number;
  feedback?: "up" | "down";
};

export type ChatRequest = {
  session_id: string;
  message: string;
  language: string;
  jurisdiction: string;
};

/** Server-sent events emitted by POST /v1/chat */
export type StreamEvent =
  | { event: "token"; data: { text: string } }
  | { event: "citations"; data: Citation[] }
  | { event: "meta"; data: { intent: Intent; confidence: number; language_detected: string; escalate: boolean } }
  | { event: "done"; data: { message_id: string } }
  | { event: "error"; data: { message: string } };

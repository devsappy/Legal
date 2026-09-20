"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { sendFeedback, streamChat } from "@/lib/api";
import { chatErrorFromUnknown } from "@/lib/chat-error";
import { SESSION_STORAGE_KEY } from "@/lib/config";
import { deleteOnServer, getConversation, pushToServer, removeConversation, saveConversation, syncFromServer } from "@/lib/history";
import type { ChatMessage, MessageContext } from "@/lib/types";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* The tab's session id lives in sessionStorage so a reload resumes the
   same conversation. Exposed as an external store so every consumer of
   the hook sees one value. */
const SESSION_EVENT = "coop:session";

function readSession() {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeSession(id: string) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function subscribeSession(cb: () => void) {
  window.addEventListener(SESSION_EVENT, cb);
  return () => window.removeEventListener(SESSION_EVENT, cb);
}

const titleOf = (text: string) => text.replace(/\s+/g, " ").slice(0, 96);

/** The user turn that produced the message at `idx` (itself, when it is a user turn). */
function userTurnBefore(list: ChatMessage[], idx: number): number {
  for (let i = idx; i >= 0; i--) if (list[i].role === "user") return i;
  return -1;
}

export function useChat(language: string, jurisdiction: string) {
  const sessionId = useSyncExternalStore(subscribeSession, readSession, () => "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Set when the transcript changes locally; cleared once it is persisted.
  const dirty = useRef(false);
  // Mirror for callbacks that need the transcript without re-binding.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // A session from an earlier page load in this tab: bring its transcript back.
  const [restoredFrom, setRestoredFrom] = useState("");
  if (sessionId && sessionId !== restoredFrom) {
    setRestoredFrom(sessionId);
    if (messages.length === 0) {
      const saved = getConversation(sessionId);
      if (saved) setMessages(saved.messages);
    }
  }

  // The server keeps the signed-in user's conversations; merge them in once.
  useEffect(() => {
    void syncFromServer();
  }, []);

  // Persist once the stream settles so the sidebar can list and reopen it.
  useEffect(() => {
    if (busy || !dirty.current || !sessionId) return;
    const firstUser = messages.find((m) => m.role === "user");
    if (!firstUser) return;
    dirty.current = false;
    const conversation = {
      id: sessionId,
      title: titleOf(firstUser.text),
      updatedAt: Date.now(),
      messages,
    };
    saveConversation(conversation);
    pushToServer(conversation);
  }, [messages, busy, sessionId]);

  const patch = useCallback((id: string, fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  /**
   * Sends `text` as a new turn. With `from`, the transcript is first cut at
   * that message (it and everything after are dropped) so a regenerate or an
   * edited question replaces the old exchange instead of appending to it.
   */
  const run = useCallback(
    async (text: string, from?: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const context: MessageContext = { jurisdiction, language };
      const startedAt = Date.now();
      const userMsg: ChatMessage = {
        id: newId(),
        role: "user",
        text: trimmed,
        citations: [],
        status: "done",
        createdAt: startedAt,
        context,
      };
      const assistantId = newId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        text: "",
        citations: [],
        status: "streaming",
        createdAt: startedAt,
        context,
      };

      const current = messagesRef.current;
      const cut = from ? current.findIndex((m) => m.id === from) : -1;
      const before = cut >= 0 ? current.slice(0, cut) : current;
      const next = [...before, userMsg, assistantMsg];
      messagesRef.current = next;
      setMessages(next);
      setBusy(true);
      dirty.current = true;

      // First question in a fresh tab mints the session.
      let id = sessionId;
      if (!id) {
        id = newId();
        writeSession(id);
      }
      // List it in the sidebar right away; the settled transcript is saved later.
      saveConversation({
        id,
        title: titleOf((before.find((m) => m.role === "user") ?? userMsg).text),
        updatedAt: Date.now(),
        messages: [...before, userMsg],
      });

      const controller = new AbortController();
      abortRef.current = controller;
      const elapsed = () => Date.now() - startedAt;
      const withDuration = (m: ChatMessage): MessageContext => ({ ...(m.context ?? context), durationMs: elapsed() });

      try {
        for await (const ev of streamChat(
          { session_id: id, message: trimmed, language, jurisdiction },
          controller.signal,
        )) {
          switch (ev.event) {
            case "token":
              patch(assistantId, (m) => ({ ...m, text: m.text + ev.data.text }));
              break;
            case "citations":
              patch(assistantId, (m) => ({ ...m, citations: ev.data }));
              break;
            case "meta":
              patch(assistantId, (m) => ({
                ...m,
                meta: {
                  intent: ev.data.intent,
                  confidence: ev.data.confidence,
                  languageDetected: ev.data.language_detected,
                  escalate: ev.data.escalate,
                },
              }));
              break;
            case "done":
              patch(assistantId, (m) => ({
                ...m,
                id: ev.data.message_id || m.id,
                status: "done",
                context: withDuration(m),
              }));
              break;
            case "error":
              // streamChat already throws for error frames; kept for older mocks.
              throw chatErrorFromUnknown(new Error(ev.data.message));
          }
        }
        // Stream ended without an explicit done frame
        patch(assistantId, (m) => (m.status === "streaming" ? { ...m, status: "done", context: withDuration(m) } : m));
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          patch(assistantId, (m) => ({ ...m, status: "stopped", context: withDuration(m) }));
        } else {
          const failure = chatErrorFromUnknown(err);
          patch(assistantId, (m) => ({
            ...m,
            status: "error",
            context: { ...withDuration(m), error: failure.toInfo() },
          }));
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, language, jurisdiction, patch, sessionId],
  );

  const send = useCallback((text: string) => run(text), [run]);

  /** Aborts the stream; the answer keeps what arrived and is marked "stopped". */
  const stop = useCallback(() => abortRef.current?.abort(), []);

  /** Re-asks the question behind `id` (an assistant or user message), replacing that exchange. */
  const regenerate = useCallback(
    (id: string) => {
      const list = messagesRef.current;
      const idx = list.findIndex((m) => m.id === id);
      const userIdx = userTurnBefore(list, idx);
      if (userIdx < 0) return;
      void run(list[userIdx].text, list[userIdx].id);
    },
    [run],
  );

  /** Replaces the user message `id` (and every later turn) with `text` and asks again. */
  const editAndResend = useCallback(
    (id: string, text: string) => {
      const list = messagesRef.current;
      const idx = list.findIndex((m) => m.id === id);
      if (idx < 0) return void run(text);
      void run(text, list[userTurnBefore(list, idx)]?.id ?? id);
    },
    [run],
  );

  /** Asks the last question again. */
  const retry = useCallback(() => {
    const list = messagesRef.current;
    const lastUser = [...list].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    void run(lastUser.text, lastUser.id);
  }, [run]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dirty.current = false;
    setMessages([]);
    writeSession(newId());
  }, []);

  /** Reopen a past conversation from the sidebar. */
  const open = useCallback(
    (id: string) => {
      const saved = getConversation(id);
      if (!saved || id === sessionId) return;
      abortRef.current?.abort();
      dirty.current = false;
      setMessages(saved.messages);
      writeSession(id);
    },
    [sessionId],
  );

  const remove = useCallback(
    (id: string) => {
      removeConversation(id);
      deleteOnServer(id);
      if (id === sessionId) reset();
    },
    [sessionId, reset],
  );

  const feedback = useCallback(
    (id: string, value: "up" | "down", note?: string) => {
      dirty.current = true;
      patch(id, (m) => ({ ...m, feedback: value }));
      // Send the exchange along so a thumbs-down can open a review item.
      const list = messagesRef.current;
      const idx = list.findIndex((m) => m.id === id);
      const question = [...list.slice(0, Math.max(0, idx))].reverse().find((m) => m.role === "user")?.text;
      const ctx = list[idx]?.context;
      void sendFeedback(id, value, {
        question,
        answer: list[idx]?.text,
        language: ctx?.language ?? language,
        jurisdiction: ctx?.jurisdiction ?? jurisdiction,
        note: note?.trim() || undefined,
      });
    },
    [patch, language, jurisdiction],
  );

  return { messages, busy, sessionId, send, stop, retry, reset, open, remove, feedback, regenerate, editAndResend };
}

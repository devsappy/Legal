"use client";

import { Suspense, useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { usePrefs } from "@/lib/prefs";
import { speak } from "@/lib/speech-store";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import { Button } from "@/components/ui/Button";
import { useChatContext } from "./ChatProvider";
import { Composer, type ComposerSeed } from "./Composer";
import { ContextDivider, contextDiffers } from "./ContextDivider";
import { DayDivider, dayKey } from "./DayDivider";
import { EmptyState } from "./EmptyState";
import { JumpToLatest } from "./JumpToLatest";
import { MessageBubble } from "./MessageBubble";
import { StreamStatus } from "./StreamStatus";

/** Distance from the bottom, in px, within which the log still follows the stream. */
const FOLLOW_WITHIN = 160;
const AWAY_BEYOND = 80;

/* Every seed gets a fresh key so the composer adopts it even when the text repeats. */
let seedSeq = 0;
const nextSeed = (text: string): ComposerSeed => ({ text, key: ++seedSeq });

/**
 * The Ask page. Reads ?q= (and ?jurisdiction=) once to seed the composer,
 * then cleans the URL; useSearchParams needs the Suspense boundary.
 */
export function ChatPanel() {
  return (
    <Suspense fallback={null}>
      <ChatPanelInner />
    </Suspense>
  );
}

function reducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  if (document.documentElement.dataset.motion === "reduced") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function ChatPanelInner() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const chat = useChatContext();
  const prefs = usePrefs();
  const router = useRouter();
  const params = useSearchParams();
  const { jurisdiction, setJurisdiction } = useJurisdiction();

  const speechLang = LANGUAGES.find((l) => l.code === locale)?.speech ?? "en-IN";
  const act = JURISDICTIONS.find((j) => j.id === jurisdiction) ?? JURISDICTIONS[0];

  /* ---- ?q= seeding: the only reader of the query in the app ---- */
  const q = params.get("q");
  const wantedJurisdiction = params.get("jurisdiction");
  const [seed, setSeed] = useState<ComposerSeed | undefined>(() => (q ? nextSeed(q) : undefined));
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    if (q) setSeed(nextSeed(q));
  }
  const applyQuery = useEffectEvent(() => {
    if (wantedJurisdiction && JURISDICTIONS.some((j) => j.id === wantedJurisdiction)) setJurisdiction(wantedJurisdiction);
    router.replace("/ask");
  });
  useEffect(() => {
    if (q === null && wantedJurisdiction === null) return;
    applyQuery();
  }, [q, wantedJurisdiction]);

  const seedWith = (text: string) => setSeed(nextSeed(text));

  /* ---- edit & resend: the text goes to the composer; later turns go on send ---- */
  const [editing, setEditing] = useState<string | null>(null);
  const editingIdx = editing ? chat.messages.findIndex((m) => m.id === editing) : -1;
  const startEdit = (id: string) => {
    const m = chat.messages.find((x) => x.id === id);
    if (!m) return;
    setEditing(id);
    seedWith(m.text);
  };
  const cancelEdit = () => {
    setEditing(null);
    seedWith("");
  };

  /* ---- scrolling: follow the stream unless the reader has scrolled up ---- */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAway(el.scrollHeight - el.scrollTop - el.clientHeight > AWAY_BEYOND);
  };
  const count = chat.messages.length;
  const prevCount = useRef(count);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const appended = count !== prevCount.current;
    prevCount.current = count;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < FOLLOW_WITHIN;
    if (!near && !appended) return;
    // A new turn glides into view; token growth follows instantly so it never lags.
    if (appended) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
    else el.scrollTop = el.scrollHeight;
  }, [chat.messages, count]);
  const jumpToLatest = () => {
    const el = scrollRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  };

  /* ---- auto-read: speak an answer that finished in this session ---- */
  const wasBusy = useRef(chat.busy);
  useEffect(() => {
    const last = chat.messages[chat.messages.length - 1];
    if (wasBusy.current && !chat.busy && prefs.autoRead && last?.role === "assistant" && last.status === "done" && last.text) {
      speak(last.id, last.text, last.meta?.languageDetected ?? last.context?.language ?? locale);
    }
    wasBusy.current = chat.busy;
  }, [chat.busy, chat.messages, prefs.autoRead, locale]);

  const empty = count === 0;

  const onSend = (text: string) => {
    // A stale seed must not come back when the composer remounts in the dock.
    setSeed(undefined);
    if (editing) {
      const id = editing;
      setEditing(null);
      chat.editAndResend(id, text);
    } else {
      void chat.send(text);
    }
  };

  const composer = (
    <div>
      {editing && (
        <div className="rise mb-2 flex items-center gap-2 rounded-lg border border-rule bg-muted px-3 py-1.5 text-xs text-ink-2" data-motion>
          <Pencil size={13} className="shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{t("editing")}</span>
          <Button size="xs" variant="ghost" onClick={cancelEdit}>
            {t("cancelEdit")}
          </Button>
        </div>
      )}
      <Composer
        busy={chat.busy}
        speechLang={speechLang}
        sessionId={chat.sessionId}
        onSend={onSend}
        onStop={chat.stop}
        seed={seed}
        autoFocus={empty}
      />
      {/* What the next answer will be based on, and what it is not. */}
      <p className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-1 text-[11.5px] leading-snug text-ink-3">
        <span className="min-w-0 truncate">
          {t("answeringFrom")} <span className="text-ink-2">{act.act}</span>
        </span>
        <span>{t("notice")}</span>
      </p>
    </div>
  );

  if (empty) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <EmptyState onPick={seedWith} composer={composer} />
      </div>
    );
  }

  const lastAssistantId = [...chat.messages].reverse().find((m) => m.role === "assistant")?.id;
  const rows: ReactNode[] = [];
  chat.messages.forEach((m, i) => {
    const prev = chat.messages[i - 1];
    if (!prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)) rows.push(<DayDivider key={`day-${m.id}`} ts={m.createdAt} />);
    if (m.role === "user" && m.context && contextDiffers(prev?.context, m.context)) {
      rows.push(<ContextDivider key={`ctx-${m.id}`} context={m.context} />);
    }
    rows.push(
      <MessageBubble
        key={m.id}
        message={m}
        isLatest={m.id === lastAssistantId}
        busy={chat.busy}
        showTrace={prefs.showTrace}
        dimmed={editingIdx >= 0 && i >= editingIdx}
        onFeedback={chat.feedback}
        onRegenerate={chat.regenerate}
        onRetry={chat.retry}
        onEdit={startEdit}
      />,
    );
  });

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="scroll-thin flex-1 overflow-y-auto"
        role="log"
        aria-live="off"
        aria-busy={chat.busy}
      >
        <div className="mx-auto w-full max-w-3xl space-y-7 px-4 py-6 sm:space-y-9 sm:py-8">{rows}</div>
      </div>

      <StreamStatus messages={chat.messages} />

      <div className="relative shrink-0 bg-sheet pb-2 pt-3">
        <JumpToLatest visible={away && chat.busy} onClick={jumpToLatest} className="-top-11" />
        <div className="mx-auto w-full max-w-3xl px-4">{composer}</div>
      </div>
    </div>
  );
}

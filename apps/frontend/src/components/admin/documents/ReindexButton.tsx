"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ApiError, documents, type ReindexResult } from "@/lib/admin-api";
import { formatSeconds } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Badge, Button, Meter, Spinner, type ButtonSize, type ButtonVariant } from "@/components/ui";

/**
 * One rebuild at a time, shared by every button that can start it (page
 * header, status card, quick action, document drawer, the upload toast).
 * The job lives in a module store so all of them show the same state and a
 * second click cannot start a second request.
 */
export type ReindexJob = {
  status: "idle" | "running" | "done" | "error";
  startedAt: number | null;
  finishedAt: number | null;
  result: ReindexResult | null;
  error: string | null;
};

/** A full rebuild of the pilot corpus takes about this long; the fill eases towards it. */
const EXPECTED_MS = 60_000;

const IDLE: ReindexJob = { status: "idle", startedAt: null, finishedAt: null, result: null, error: null };
let job: ReindexJob = IDLE;
let inflight: Promise<ReindexResult> | null = null;
const listeners = new Set<() => void>();

function set(next: ReindexJob) {
  job = next;
  for (const cb of listeners) cb();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
export function getReindexJob(): ReindexJob {
  return job;
}
export function useReindexJob(): ReindexJob {
  return useSyncExternalStore(subscribe, getReindexJob, () => IDLE);
}

/** Starts the rebuild, or joins the one already running. */
function run(): Promise<ReindexResult> {
  if (inflight) return inflight;
  set({ status: "running", startedAt: Date.now(), finishedAt: null, result: null, error: null });
  inflight = documents
    .reindex()
    .then(
      (result) => {
        set({ ...job, status: "done", finishedAt: Date.now(), result });
        return result;
      },
      (err: unknown) => {
        const message = err instanceof ApiError ? (err.detail ?? err.code) : String(err);
        set({ ...job, status: "error", finishedAt: Date.now(), error: message });
        throw err;
      },
    )
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Milliseconds since the job started; ticks while it runs, freezes when it ends. */
export function useReindexElapsed(): number {
  const j = useReindexJob();
  const running = j.status === "running";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);
  if (!j.startedAt) return 0;
  const end = running ? Math.max(now, j.startedAt) : (j.finishedAt ?? j.startedAt);
  return end - j.startedAt;
}

/**
 * The job plus a `start` that reports through toasts and refreshes the
 * server data afterwards. Call sites: `const { job, start } = useReindex()`.
 */
export function useReindex() {
  const t = useTranslations("admin.corpus.job");
  const router = useRouter();
  const current = useReindexJob();

  const start = useCallback(async () => {
    if (getReindexJob().status === "running") {
      toast.info(t("alreadyRunning"));
      return;
    }
    try {
      const r = await run();
      if (r.note) toast.info(t("bm25"));
      toast.success(t("reindexed", { count: r.embedded, seconds: r.seconds }));
      router.refresh();
    } catch (err) {
      toast.error(t("failed"), { description: err instanceof ApiError ? err.detail : undefined });
    }
  }, [t, router]);

  return { job: current, start };
}

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/** "Rebuild index" that turns into a live "Rebuilding… 12.4s" while the job runs. */
export function ReindexButton({ variant = "outline", size = "md", className }: ButtonProps) {
  const t = useTranslations("admin.corpus");
  const { job: j, start } = useReindex();
  const elapsed = useReindexElapsed();
  const running = j.status === "running";

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => void start()}
      aria-busy={running || undefined}
      disabled={running}
    >
      {running ? <Spinner size={14} /> : <RefreshCw size={14} aria-hidden />}
      {running ? (
        <span className="tabular-nums">
          {t("job.reindexing")} <span className="font-mono text-xs text-ink-3">{formatSeconds(elapsed)}</span>
        </span>
      ) : (
        t("reindex")
      )}
    </Button>
  );
}

/**
 * The visible job: a fill that eases towards the expected duration while
 * running, then the outcome line (embedded count, BM25 warning or error).
 * Renders nothing while idle so it can sit permanently inside the status card.
 */
export function ReindexJobBar() {
  const t = useTranslations("admin.corpus.job");
  const j = useReindexJob();
  const elapsed = useReindexElapsed();
  if (j.status === "idle") return null;

  const ratio = j.status === "running" ? Math.min(0.92, elapsed / EXPECTED_MS) : 1;
  return (
    <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-busy={j.status === "running" || undefined}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-ink-2">
          {j.status === "running" && <Spinner size={12} />}
          {j.status === "running" && t("reindexing")}
          {j.status === "done" && j.result && t("reindexed", { count: j.result.embedded, seconds: j.result.seconds })}
          {j.status === "error" && <span className="text-seal">{t("failed")}</span>}
        </span>
        <span className="shrink-0 font-mono tabular-nums text-ink-3">{t("elapsed", { seconds: (elapsed / 1000).toFixed(1) })}</span>
      </div>
      {j.status === "running" && <Meter value={ratio} label={t("reindexing")} />}
      {j.status === "done" && j.result?.note && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
          <Badge kind="warn" dot>
            {t("bm25Badge")}
          </Badge>
          <span>{t("bm25")}</span>
        </div>
      )}
      {j.status === "error" && j.error && <p className="font-mono text-xs text-ink-2">{j.error}</p>}
    </div>
  );
}

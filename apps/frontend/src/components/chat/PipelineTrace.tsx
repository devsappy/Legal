"use client";

import { useTranslations } from "next-intl";
import { CallChip, ThoughtLine, type CallChipStatus } from "@/components/reactbits";
import { JURISDICTIONS, LANGUAGES } from "@/lib/config";
import { useJurisdiction } from "@/components/layout/JurisdictionProvider";
import type { ChatMessage } from "@/lib/types";

type Props = {
  message: ChatMessage;
  onRetry: () => void;
};

/**
 * What the assistant is doing, told from the stream itself:
 * meta → language understood, citations → sections found and checked,
 * first token → drafting. Settles into "Answered in Ns" when the stream
 * ends, or "Stopped after Ns" when the reader cut it short. The Act comes
 * from the message's own context, so an old answer keeps naming the Act it
 * was answered from even after the chip has moved on.
 */
export function PipelineTrace({ message, onRetry }: Props) {
  const t = useTranslations("chat");
  const { jurisdiction: current } = useJurisdiction();
  const jurisdiction = message.context?.jurisdiction ?? current;
  const act = JURISDICTIONS.find((j) => j.id === jurisdiction)?.short ?? jurisdiction;

  const hasMeta = !!message.meta;
  const hasCitations = message.citations.length > 0;
  const hasText = message.text.length > 0;
  const streaming = message.status === "streaming";
  const failed = message.status === "error";
  const stopped = message.status === "stopped";
  const allVerified = hasCitations && message.citations.every((c) => c.verified);

  const langName =
    LANGUAGES.find((l) => l.code === message.meta?.languageDetected)?.native ??
    message.meta?.languageDetected ??
    "";

  const steps: string[] = [t("trace.detect")];
  if (hasMeta) steps.push(t("trace.detected", { lang: langName }));
  steps.push(t("trace.search", { act }));
  if (hasCitations) {
    steps.push(t("trace.found", { count: message.citations.length }));
    steps.push(t("trace.verify"));
  }
  if (hasText) steps.push(t("trace.draft"));

  const search: CallChipStatus = hasCitations ? "done" : failed ? "error" : "running";
  const verify: CallChipStatus = !hasCitations ? "idle" : allVerified ? "done" : "error";
  const draft: CallChipStatus = failed
    ? "error"
    : !hasText
      ? "idle"
      : streaming
        ? "running"
        : "done";

  const chipProps = {
    size: 26,
    radius: 6,
    color: "var(--ink)",
    surfaceColor: "var(--muted)",
    progressColor: "var(--ink)",
    progressOpacity: 0.07,
    doneColor: "var(--verified)",
    errorColor: "var(--seal)",
    washOpacity: 0.16,
    showTimer: false,
  } as const;

  // A settled answer shows its real duration, not a timer restarted on reopen.
  const durationMs = message.context?.durationMs;
  const elapsed = !streaming && durationMs !== undefined ? durationMs / 1000 : undefined;

  return (
    <div className="mb-3 space-y-2" data-print="hide">
      <ThoughtLine
        working={streaming}
        steps={steps}
        label={t("thinking")}
        doneLabel={stopped ? t("stoppedAfter") : failed ? t("answerFailed") : t("answeredIn")}
        glyph="dot"
        fontSize={13}
        color="var(--ink-2)"
        glyphColor="var(--ink)"
        collapsible
        collapseOnSettle
        showTimer={!failed}
        elapsed={elapsed}
      />

      {(streaming || failed) && (
        <div className="flex flex-wrap gap-1.5 font-mono">
          <CallChip
            {...chipProps}
            icon="search"
            name={t("tools.search")}
            argument={act}
            status={search}
            expectedMs={1500}
          />
          <CallChip
            {...chipProps}
            icon="file"
            name={t("tools.verify")}
            argument={hasCitations ? t("tools.sections", { count: message.citations.length }) : "—"}
            status={verify}
            expectedMs={400}
            shake={0}
          />
          <CallChip
            {...chipProps}
            icon="edit"
            name={t("tools.draft")}
            argument={langName || "…"}
            status={draft}
            expectedMs={6000}
            onRetry={failed ? onRetry : undefined}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Check, RefreshCw, TriangleAlert, Upload } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { JURISDICTIONS } from "@/lib/config";
import { ApiError, documents, type UploadResult } from "@/lib/admin-api";
import { toast } from "@/lib/toast";
import { CallChip, ThoughtLine, type CallChipStatus } from "@/components/reactbits";
import { Button, Dialog, Field, Input, Select } from "@/components/ui";
import { IndexingIndicator } from "@/components/admin/IndexingIndicator";
import { Dropzone, kindOf, validateFile } from "./Dropzone";
import { useReindex } from "./ReindexButton";

type Phase = "form" | "job" | "done" | "error";
type Stage = "upload" | "convert" | "save";

type Job = {
  stage: Stage;
  /** 0..1 of the request body sent. */
  sent: number;
  isPdf: boolean;
  fileName: string;
  fileSize: number;
  result: UploadResult | null;
  error: string | null;
};

const CHIP = {
  size: 26,
  radius: 6,
  color: "var(--ink)",
  surfaceColor: "var(--muted)",
  progressColor: "var(--ink)",
  progressOpacity: 0.07,
  doneColor: "var(--ink)",
  errorColor: "var(--seal)",
  washOpacity: 0.16,
  showTimer: false,
} as const;

/** Strips ?upload=1 once the dialog closes so a reload does not reopen it. */
function clearUploadParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("upload")) return;
  url.searchParams.delete("upload");
  window.history.replaceState(null, "", url);
}

type Props = {
  /** Open on first render (the page saw ?upload=1). */
  defaultOpen?: boolean;
  /** Button variant for the trigger in the page header. */
  variant?: "primary" | "outline";
  size?: "sm" | "md";
};

/**
 * "Upload document" and its dialog. The form validates the file (type and
 * 25 MB) and the title before any request; on submit the dialog becomes a
 * job view — Upload → Convert PDF (PDFs only) → Save sections — driven by
 * real upload progress and the response, then a summary with a shortcut to
 * rebuild the index. Failures show the backend's detail with a retry.
 */
export function UploadDialog({ defaultOpen = false, variant = "primary", size = "md" }: Props) {
  const t = useTranslations("admin.corpus");
  const tu = useTranslations("ui");
  const router = useRouter();
  const { start: startReindex } = useReindex();
  const id = useId();
  const formId = `${id}-form`;
  const titleRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(defaultOpen);
  const [phase, setPhase] = useState<Phase>("form");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [jurisdiction, setJurisdiction] = useState(JURISDICTIONS[0].id);
  const [job, setJob] = useState<Job | null>(null);

  const reset = () => {
    setPhase("form");
    setFile(null);
    setFileError(null);
    setTitle("");
    setTitleError(null);
    setJob(null);
  };

  const onOpenChange = (next: boolean) => {
    if (!next && phase === "job") return; // never abandon a running ingest silently
    setOpen(next);
    if (!next) clearUploadParam();
    if (next && phase !== "form") reset();
  };

  const pickFile = (f: File | null) => {
    setFile(f);
    if (!f) {
      setFileError(null);
      return;
    }
    const problem = validateFile(f);
    setFileError(problem ? t(`dialog.${problem}`) : null);
    if (problem) setFile(null);
  };

  const run = async (f: File, actTitle: string) => {
    const isPdf = kindOf(f.name) === "pdf";
    setPhase("job");
    setJob({ stage: "upload", sent: 0, isPdf, fileName: f.name, fileSize: f.size, result: null, error: null });
    const fd = new FormData();
    fd.set("file", f);
    fd.set("jurisdiction", jurisdiction);
    fd.set("title", actTitle);
    try {
      const result = await documents.upload(fd, {
        onProgress: (ratio) =>
          setJob((j) => (j ? { ...j, sent: ratio, stage: ratio >= 1 ? (j.isPdf ? "convert" : "save") : "upload" } : j)),
      });
      setJob((j) => (j ? { ...j, sent: 1, stage: "save", result } : j));
      setPhase("done");
      router.refresh();
      toast.success(
        result.sections === null ? t("dialog.uploadedToastUnknown") : t("dialog.uploadedToast", { count: result.sections }),
        { action: { label: t("dialog.rebuildNow"), onClick: () => void startReindex() } },
      );
    } catch (err) {
      const detail = err instanceof ApiError ? (err.detail ?? err.code) : String(err);
      setJob((j) => (j ? { ...j, error: detail } : j));
      setPhase("error");
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const actTitle = title.trim();
    let ok = true;
    if (!file) {
      setFileError(t("dialog.chooseFile"));
      ok = false;
    }
    if (actTitle.length < 3) {
      setTitleError(t("dialog.actTitleShort"));
      titleRef.current?.focus();
      ok = false;
    } else setTitleError(null);
    if (!ok || !file) return;
    void run(file, actTitle);
  };

  const retry = () => {
    if (!file) {
      reset();
      return;
    }
    void run(file, title.trim());
  };

  /* ---- chip statuses from the job ---- */
  const chips = (() => {
    if (!job) return null;
    const failed = phase === "error";
    const upload: CallChipStatus = job.stage === "upload" ? (failed ? "error" : "running") : "done";
    const convert: CallChipStatus = !job.isPdf
      ? "idle"
      : job.stage === "upload"
        ? "idle"
        : job.stage === "convert"
          ? failed
            ? "error"
            : "running"
          : "done";
    const save: CallChipStatus = phase === "done" ? "done" : job.stage === "save" ? (failed ? "error" : "running") : "idle";
    return { upload, convert, save };
  })();

  const steps: string[] = [];
  if (job) {
    if (job.stage !== "upload") steps.push(t("dialog.stepUpload"));
    if (job.isPdf && (job.stage === "save" || phase === "done")) steps.push(t("dialog.stepConvert"));
    if (phase === "done") steps.push(t("dialog.stepSave"));
  }
  const stageLabel = !job
    ? ""
    : phase === "error"
      ? t("dialog.failed")
      : phase === "done"
        ? t("dialog.done")
        : job.stage === "upload"
          ? `${t("dialog.stepUpload")} · ${Math.round(job.sent * 100)}%`
          : job.stage === "convert"
            ? `${t("dialog.stepConvert")}…`
            : `${t("dialog.stepSave")}…`;

  const footer =
    phase === "form" ? (
      <>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          {tu("cancel")}
        </Button>
        <Button type="submit" form={formId} variant="primary">
          <Upload size={14} aria-hidden />
          {t("dialog.submit")}
        </Button>
      </>
    ) : phase === "done" ? (
      <>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          {t("dialog.close")}
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onOpenChange(false);
            void startReindex();
          }}
        >
          <RefreshCw size={14} aria-hidden />
          {t("dialog.rebuildNow")}
        </Button>
      </>
    ) : phase === "error" ? (
      <>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          {t("dialog.close")}
        </Button>
        <Button variant="primary" onClick={retry}>
          <RefreshCw size={14} aria-hidden />
          {t("dialog.retry")}
        </Button>
      </>
    ) : undefined;

  return (
    <>
      <Button variant={variant} size={size} onClick={() => onOpenChange(true)}>
        <Upload size={14} aria-hidden />
        {t("upload")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("dialog.title")}
        description={phase === "form" ? t("dialog.description") : undefined}
        size="md"
        footer={footer}
      >
        {phase === "form" ? (
          <form id={formId} onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Field id={`${id}-file`} label={t("dialog.file")} error={fileError ?? undefined} required>
              {(a11y) => <Dropzone id={a11y.id} describedBy={a11y["aria-describedby"]} file={file} onFile={pickFile} error={fileError} />}
            </Field>
            <Field id={`${id}-title`} label={t("dialog.actTitle")} hint={t("dialog.actTitleHint")} error={titleError ?? undefined} required>
              {(a11y) => (
                <Input
                  {...a11y}
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Maharashtra Cooperative Societies Act, 1960"
                  autoComplete="off"
                  invalid={Boolean(titleError)}
                  minLength={3}
                  required
                />
              )}
            </Field>
            <Field id={`${id}-jurisdiction`} label={t("dialog.jurisdiction")}>
              {(a11y) => (
                <Select
                  {...a11y}
                  size="md"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  options={JURISDICTIONS.map((j) => ({ value: j.id, label: `${j.name} — ${j.short}` }))}
                  className="w-full"
                />
              )}
            </Field>
          </form>
        ) : (
          job && (
            <div className="flex flex-col gap-4" aria-busy={phase === "job" || undefined}>
              <ThoughtLine
                working={phase === "job"}
                label={t("dialog.ingesting")}
                doneLabel={phase === "error" ? t("dialog.failed") : t("dialog.ingested")}
                steps={steps}
                glyph="dot"
                fontSize={13.5}
                color="var(--ink-2)"
                glyphColor="var(--ink)"
                collapsible
                collapseOnSettle={false}
                showTimer
              />
              {chips && (
                <div className="flex flex-wrap gap-1.5 font-mono">
                  <CallChip
                    {...CHIP}
                    icon="file"
                    name={t("dialog.stepUpload")}
                    argument={job.stage === "upload" ? `${Math.round(job.sent * 100)}%` : job.fileName}
                    status={chips.upload}
                    expectedMs={Math.max(800, job.fileSize / 1000)}
                  />
                  {job.isPdf && (
                    <CallChip {...CHIP} icon="terminal" name={t("dialog.stepConvert")} argument="pdf → md" status={chips.convert} expectedMs={60_000} />
                  )}
                  <CallChip
                    {...CHIP}
                    icon="edit"
                    name={t("dialog.stepSave")}
                    argument={
                      job.result
                        ? job.result.sections === null
                          ? "—"
                          : t("dialog.saved", { count: job.result.sections })
                        : "…"
                    }
                    status={chips.save}
                    expectedMs={400}
                  />
                </div>
              )}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-rule bg-muted/40 px-3 py-2">
                <IndexingIndicator
                  label={stageLabel}
                  doneLabel={stageLabel}
                  errorLabel={stageLabel}
                  status={phase === "error" ? "error" : phase === "done" ? "done" : "working"}
                />
                <span className="truncate font-mono text-2xs text-ink-3" aria-hidden>
                  {job.fileName}
                </span>
              </div>

              {phase === "done" && job.result && (
                <div className="flex items-start gap-3 rounded-lg border border-rule bg-sheet p-4" role="status">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-ink text-paper" aria-hidden>
                    <Check size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{t("dialog.done")}</p>
                    <p className="mt-0.5 text-sm text-ink-2">
                      {job.result.sections === null
                        ? t("dialog.doneBodyUnknown", { file: job.result.file })
                        : t("dialog.doneBody", { file: job.result.file, count: job.result.sections })}
                    </p>
                  </div>
                </div>
              )}

              {phase === "error" && (
                <div className="flex items-start gap-3 rounded-lg border border-seal/40 bg-sheet p-4" role="alert">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-seal-soft text-seal" aria-hidden>
                    <TriangleAlert size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-seal">{t("dialog.failed")}</p>
                    <p className="mt-0.5 text-sm text-ink-2">{t("dialog.failedBody")}</p>
                    {job.error && <p className="mt-1.5 break-words font-mono text-xs text-ink-3">{job.error}</p>}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </Dialog>
    </>
  );
}

"use client";

import { useId, useRef, useState, type DragEvent, type Ref } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { FileText, Upload, X } from "lucide-react";
import { formatBytes } from "@/lib/format";
import { IconButton } from "@/components/ui";

export const MAX_BYTES = 25 * 1024 * 1024;
export const ACCEPT = [".pdf", ".md", ".txt"] as const;

export type FileKind = "pdf" | "md" | "txt";

export function kindOf(name: string): FileKind | null {
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  return ext === ".pdf" ? "pdf" : ext === ".md" ? "md" : ext === ".txt" ? "txt" : null;
}

/** "badType" | "tooLarge" | null — checked before any request leaves the browser. */
export function validateFile(file: File): "badType" | "tooLarge" | null {
  if (!kindOf(file.name)) return "badType";
  if (file.size > MAX_BYTES) return "tooLarge";
  return null;
}

type Props = {
  file: File | null;
  onFile: (file: File | null) => void;
  /** Rejection reason for the last drop/pick, shown inline in seal. */
  error?: string | null;
  disabled?: boolean;
  /** Forwarded to the hidden file input for form wiring (id, aria-describedby). */
  id?: string;
  describedBy?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * Drag-and-drop target with a keyboard path: the visible area is a real
 * button that opens the picker, and the input is the form control. Only
 * .pdf/.md/.txt up to 25 MB get through; the parent shows the reason.
 */
export function Dropzone({ file, onFile, error, disabled, id, describedBy, ref }: Props) {
  const t = useTranslations("admin.corpus.dialog");
  const locale = useLocale();
  const autoId = useId();
  const inputId = id ?? `${autoId}-file`;
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const pick = (list: FileList | null) => {
    const f = list?.[0] ?? null;
    onFile(f);
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    pick(e.dataTransfer.files);
  };
  const onDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (!disabled && !over) setOver(true);
  };

  const kind = file ? kindOf(file.name) : null;

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={(node) => {
          input.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        id={inputId}
        type="file"
        accept={ACCEPT.join(",")}
        className="sr-only"
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          pick(e.target.files);
          // Allow re-picking the same file after a removal.
          e.target.value = "";
        }}
      />
      {file ? (
        <div
          className={clsx(
            "flex items-center gap-3 rounded-lg border bg-sheet px-3 py-2.5",
            error ? "border-seal/60" : "border-rule",
          )}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setOver(false)}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-ink-2" aria-hidden>
            <FileText size={16} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="font-mono text-2xs text-ink-3 tabular-nums">
              {formatBytes(file.size, locale)}
              {kind && ` · ${kind.toUpperCase()}`}
            </p>
          </div>
          <IconButton label={t("remove")} size="sm" onClick={() => onFile(null)} disabled={disabled}>
            <X size={14} />
          </IconButton>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setOver(false)}
          aria-describedby={describedBy}
          className={clsx(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
            "hover:border-rule-strong hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-45",
            over ? "border-ink bg-muted/60" : error ? "border-seal/60" : "border-rule-strong",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-ink-2" aria-hidden>
            <Upload size={18} strokeWidth={1.75} />
          </span>
          <span className="text-sm text-ink">
            {t("drop")} <span className="font-medium underline underline-offset-4">{t("browse")}</span>
          </span>
          <span className="font-mono text-2xs text-ink-3">{t("accepted")}</span>
        </button>
      )}
    </div>
  );
}

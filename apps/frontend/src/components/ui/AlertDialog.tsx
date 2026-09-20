"use client";

import { useId, useState } from "react";
import clsx from "clsx";
import { TriangleAlert } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { DialogBase } from "./Dialog";

export type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Red-outlined confirm button and a warning glyph; for deletes and sign-outs. */
  destructive?: boolean;
  /** The user must type this exact text before confirm enables. */
  typeToConfirm?: string;
  /** Hint above the type-to-confirm field, e.g. "Type {value} to continue". */
  typeToConfirmHint?: string;
  /** Confirm shows a spinner and both buttons lock while a request runs. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

/**
 * A modal question with exactly two answers. Uses role=alertdialog so screen
 * readers announce the body up front, ignores backdrop clicks (Escape still
 * cancels), and lands focus on the safe button. Feature code normally
 * reaches this through useConfirm() rather than rendering it directly.
 */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive,
  typeToConfirm,
  typeToConfirmHint,
  loading,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const bodyId = `${id}-body`;
  const inputId = `${id}-input`;
  const [typed, setTyped] = useState("");

  // A fresh question starts with an empty field.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setTyped("");
  }

  const armed = !typeToConfirm || typed.trim() === typeToConfirm;
  const cancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <DialogBase
      open={open}
      onOpenChange={(o) => {
        if (!o) cancel();
      }}
      role="alertdialog"
      dismissible={false}
      labelledBy={titleId}
      describedBy={body ? bodyId : undefined}
      className={clsx(
        "w-full max-h-[calc(100dvh-2rem)] rounded-lg sm:w-[calc(100vw-2rem)] sm:max-w-[420px]",
        "max-sm:mb-0 max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-xl max-sm:border-x-0 max-sm:border-b-0",
      )}
    >
      <form
        className="flex min-h-0 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          if (armed && !loading) onConfirm();
        }}
      >
        <div className="flex gap-3 px-5 pt-5">
          {destructive && (
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-seal-soft text-seal"
            >
              <TriangleAlert size={16} strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg">
              {title}
            </h2>
            {body && (
              <p id={bodyId} className="mt-1.5 text-sm text-ink-2">
                {body}
              </p>
            )}
            {typeToConfirm && (
              <div className="mt-4">
                <label htmlFor={inputId} className="mb-1.5 block text-xs text-ink-2">
                  {typeToConfirmHint ?? <span className="font-mono text-ink">{typeToConfirm}</span>}
                </label>
                <Input
                  id={inputId}
                  size="sm"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  aria-describedby={body ? bodyId : undefined}
                  className="font-mono"
                />
              </div>
            )}
          </div>
        </div>
        <footer className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-rule px-5 py-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="ghost" onClick={cancel} disabled={loading} data-autofocus>
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant={destructive ? "destructive" : "primary"}
            disabled={!armed || loading}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </footer>
      </form>
    </DialogBase>
  );
}

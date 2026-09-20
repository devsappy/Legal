"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Check, X } from "lucide-react";
import { LANGUAGES } from "@sahayak/shared";
import type { GlossaryDraft } from "@/lib/admin-api";
import { Button, Field, Input, Kbd } from "@/components/ui";

export const EMPTY_DRAFT: GlossaryDraft = { term: "", hi: "", mr: "", ta: "", source: "" };

/** The three translation columns, in LANGUAGES order, with their native headers. */
export const TRANSLATIONS = LANGUAGES.filter((l) => l.code !== "en") as { code: "hi" | "mr" | "ta"; native: string }[];

type Props = {
  initial: GlossaryDraft;
  onSubmit: (draft: GlossaryDraft) => void;
  onCancel: () => void;
  busy?: boolean;
  /** Inline error under the term field (e.g. a 409 duplicate). */
  termError?: string | null;
  /** "grid": one row of fields for the panel above the table; "stack": the phone drawer. */
  layout?: "grid" | "stack";
  /** Focus the term field on mount. */
  autoFocus?: boolean;
  submitLabel?: string;
  className?: string;
};

/**
 * The add/edit form shared by the inline panel and the phone drawer. A real
 * <form>: Enter saves (there is a submit button), Escape anywhere cancels.
 * Every input is labelled through Field; the translation fields carry the
 * language's native name so screen readers say "हिन्दी translation".
 */
export function GlossaryForm({ initial, onSubmit, onCancel, busy, termError, layout = "grid", autoFocus, submitLabel, className }: Props) {
  const t = useTranslations("admin.terms");
  const id = useId();
  const [draft, setDraft] = useState<GlossaryDraft>(initial);
  const [requiredError, setRequiredError] = useState<string | null>(null);

  const set = (key: keyof GlossaryDraft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const term = draft.term.trim();
    if (!term) {
      setRequiredError(t("form.required"));
      return;
    }
    setRequiredError(null);
    onSubmit({ term, hi: draft.hi.trim(), mr: draft.mr.trim(), ta: draft.ta.trim(), source: draft.source.trim() });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  };

  const grid = layout === "grid";
  const error = termError ?? requiredError ?? undefined;

  return (
    <form onSubmit={submit} onKeyDown={onKeyDown} className={clsx("flex flex-col gap-3", className)} noValidate aria-busy={busy || undefined}>
      <div className={clsx("grid gap-3", grid && "sm:grid-cols-[1.25fr_1fr_1fr_1fr_1fr]")}>
        <Field id={`${id}-term`} label={t("form.term")} hint={grid ? undefined : t("form.termHint")} error={error} required>
          {(a11y) => (
            <Input
              {...a11y}
              size="sm"
              value={draft.term}
              onChange={(e) => set("term")(e.target.value)}
              autoFocus={autoFocus}
              data-autofocus={autoFocus ? "" : undefined}
              autoComplete="off"
              invalid={Boolean(error)}
              disabled={busy}
            />
          )}
        </Field>
        {TRANSLATIONS.map((l) => (
          <Field key={l.code} id={`${id}-${l.code}`} label={t("form.translation", { language: l.native })}>
            {(a11y) => (
              <Input {...a11y} size="sm" lang={l.code} value={draft[l.code]} onChange={(e) => set(l.code)(e.target.value)} autoComplete="off" disabled={busy} />
            )}
          </Field>
        ))}
        <Field id={`${id}-source`} label={t("form.source")} hint={grid ? undefined : t("form.sourceHint")}>
          {(a11y) => (
            <Input
              {...a11y}
              size="sm"
              value={draft.source}
              onChange={(e) => set("source")(e.target.value)}
              placeholder="MSCS Act §3(d)"
              autoComplete="off"
              className="font-mono"
              disabled={busy}
            />
          )}
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" size="sm" loading={busy}>
          <Check size={13} aria-hidden />
          {submitLabel ?? t("form.save")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          <X size={13} aria-hidden />
          {t("form.cancel")}
        </Button>
        <span className="ml-auto hidden items-center gap-1.5 text-2xs text-ink-3 sm:inline-flex" aria-hidden>
          <Kbd combo="enter" /> {t("form.save")} · <Kbd combo="escape" /> {t("form.cancel")}
        </span>
      </div>
    </form>
  );
}

"use client";

import { useState, type Ref } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Field, IconButton, Input } from "@/components/ui";
import { passwordStrength, strengthLabel } from "@/lib/validate";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  name?: string;
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
  /** Registration: show the four-segment strength meter under the field. */
  strength?: boolean;
  ref?: Ref<HTMLInputElement>;
};

/**
 * Password input with a show/hide toggle inside the field and, on
 * registration, a strength meter. The toggle is a labelled icon button
 * whose pressed state follows the visibility; the meter is a role="meter"
 * whose fill and label are derived from the value on every render.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  name = "password",
  autoComplete,
  autoFocus,
  strength,
  ref,
}: Props) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const score = strength ? passwordStrength(value) : 0;
  const level = strengthLabel(score);

  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {(a11y) => (
        <div className="flex flex-col gap-2">
          <Input
            {...a11y}
            ref={ref}
            type={visible ? "text" : "password"}
            name={name}
            autoComplete={autoComplete}
            autoCapitalize="off"
            spellCheck={false}
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            icon={<KeyRound size={15} strokeWidth={1.75} />}
            trailing={
              <IconButton
                size="sm"
                label={visible ? t("hidePassword") : t("showPassword")}
                aria-pressed={visible}
                onClick={() => setVisible((v) => !v)}
                className="text-ink-3 hover:text-ink"
              >
                {visible ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
              </IconButton>
            }
          />
          {strength && value.length > 0 && (
            <div className="flex items-center gap-3">
              <div
                role="meter"
                aria-label={t("strength.label")}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={score}
                aria-valuetext={t(`strength.${level}`)}
                className="grid flex-1 grid-cols-4 gap-1"
              >
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={clsx(
                      "h-1 rounded-full transition-colors duration-(--dur-2)",
                      i < score ? "bg-ink" : "bg-rule",
                    )}
                    aria-hidden
                  />
                ))}
              </div>
              <span className="shrink-0 text-xs text-ink-3" aria-hidden>
                {t(`strength.${level}`)}
              </span>
            </div>
          )}
        </div>
      )}
    </Field>
  );
}

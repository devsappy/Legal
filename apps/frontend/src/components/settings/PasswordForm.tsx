"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SettingsSection } from "./SettingsSection";

const MIN = 6;

type Errors = { current?: string; next?: string; confirm?: string };

/**
 * Password change, folded away until wanted. Client checks (length,
 * match) show inline; the server's "password" error lands on the current
 * password field, and success clears the form and toasts.
 */
export function PasswordForm() {
  const t = useTranslations("settings.password");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found: Errors = {};
    if (next.length < MIN) found.next = t("tooShort");
    if (confirm !== next) found.confirm = t("mismatch");
    if (!current) found.current = t("wrong");
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (body?.error === "password") setErrors({ current: t("wrong") });
        else if (body?.error === "invalid") setErrors({ next: t("tooShort") });
        else toast.error(t("failed"));
        return;
      }
      toast.success(t("changed"));
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      toast.error(t("failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection title={t("title")} description={t("description")}>
      <Disclosure
        id="password"
        className="-mt-2"
        title={
          <span className="flex items-center gap-2">
            <KeyRound size={15} strokeWidth={1.75} className="text-ink-3" aria-hidden />
            {t("change")}
          </span>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4 pt-1" noValidate>
          <Field id="password-current" label={t("current")} error={errors.current} required>
            {(a11y) => (
              <Input
                {...a11y}
                type="password"
                name="current-password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                invalid={Boolean(errors.current)}
                className="max-w-sm"
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="password-new" label={t("new")} error={errors.next} required>
              {(a11y) => (
                <Input
                  {...a11y}
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  invalid={Boolean(errors.next)}
                />
              )}
            </Field>
            <Field id="password-confirm" label={t("confirm")} error={errors.confirm} required>
              {(a11y) => (
                <Input
                  {...a11y}
                  type="password"
                  name="confirm-password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  invalid={Boolean(errors.confirm)}
                />
              )}
            </Field>
          </div>
          <div className="flex justify-end border-t border-rule pt-4">
            <Button type="submit" variant="primary" loading={saving} disabled={!current || !next || !confirm}>
              {t("change")}
            </Button>
          </div>
        </form>
      </Disclosure>
    </SettingsSection>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import type { SessionUser } from "@sahayak/shared";
import { useRouter } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Tooltip } from "@/components/ui/Tooltip";
import { SettingsSection } from "./SettingsSection";

/** The session user; `createdAt` is shown when the backend includes it. */
type ProfileUser = SessionUser & { createdAt?: string };

const MIN = 2;
const MAX = 80;

/**
 * Name and account facts. Saving PATCHes /api/auth/me and refreshes the
 * server tree, so the sidebar's name updates without a reload. The email
 * is the sign-in and stays read-only.
 */
export function ProfileForm({ user }: { user: ProfileUser }) {
  const t = useTranslations("settings.profile");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // After a refresh the server hands down the saved name; adopt it (derived during render).
  const [seen, setSeen] = useState(user.name);
  if (user.name !== seen) {
    setSeen(user.name);
    setName(user.name);
  }

  const trimmed = name.trim().replace(/\s+/g, " ");
  const dirty = trimmed !== user.name;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (trimmed.length < MIN || trimmed.length > MAX) {
      setError(t("nameInvalid"));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (body?.error === "invalid") setError(t("nameInvalid"));
        else toast.error(t("failed"));
        return;
      }
      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(t("failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection title={t("title")} description={t("description")}>
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="flex items-center gap-3">
          <Avatar name={trimmed || user.name} size="lg" />
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-ink-3">{t("role")}</dt>
              <dd>
                <Badge kind={user.role === "admin" ? "solid" : "neutral"}>{t(`roles.${user.role}`)}</Badge>
              </dd>
            </div>
            {user.createdAt && (
              <div className="flex items-center gap-2">
                <dt className="text-ink-3">{t("memberSince")}</dt>
                <dd className="font-mono text-xs text-ink-2">{formatDate(user.createdAt, locale)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="profile-name" label={t("name")} hint={error ? undefined : t("nameHint")} error={error ?? undefined} required>
            {(a11y) => (
              <Input
                {...a11y}
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="name"
                maxLength={MAX}
                invalid={Boolean(error)}
              />
            )}
          </Field>
          <Field id="profile-email" label={t("email")} hint={t("emailHint")}>
            {(a11y) => (
              <Tooltip content={t("emailHint")}>
                <Input
                  {...a11y}
                  name="email"
                  type="email"
                  value={user.email}
                  readOnly
                  autoComplete="email"
                  trailing={<Lock size={14} strokeWidth={1.75} aria-hidden />}
                  className="[&>input]:cursor-default [&>input]:text-ink-2"
                />
              </Tooltip>
            )}
          </Field>
        </div>

        <div className="flex justify-end border-t border-rule pt-4">
          <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
            {t("save")}
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}

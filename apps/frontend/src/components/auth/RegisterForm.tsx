"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Mail, User } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge, Button, Field, Input } from "@/components/ui";
import { setPlan } from "@/lib/onboarding";
import { PASSWORD_MIN, email as emailRule, hasErrors, minLength, name as nameRule, validateAll } from "@/lib/validate";
import { FormError, errorKindFor, type FormErrorKind } from "./FormError";
import { PasswordField } from "./PasswordField";

type Props = {
  /** The pricing tile the visitor came from (?plan=), persisted on success. */
  plan?: string | null;
};

type Key = "name" | "email" | "password";

const RULES = { name: nameRule, email: emailRule, password: minLength(PASSWORD_MIN) } as const;

export function RegisterForm({ plan = null }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [values, setValues] = useState<Record<Key, string>>({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<FormErrorKind | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const errors = validateAll(values, RULES);
  const message = (key: Key) =>
    touched[key] && errors[key] ? t(`auth.validation.${errors[key]}`, { min: PASSWORD_MIN }) : undefined;

  const set = (key: Key) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (error) setError(null);
  };
  const touch = (key: Key) => () => setTouched((x) => ({ ...x, [key]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setTouched({ name: true, email: true, password: true });
    if (hasErrors(errors)) {
      (errors.name ? nameRef : errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name.trim(), email: values.email.trim(), password: values.password }),
    }).catch(() => null);
    if (res?.ok) {
      if (plan) setPlan(plan);
      router.replace("/home?welcome=1");
      router.refresh();
      return;
    }
    setError(errorKindFor(res, "invalid"));
    setPending(false);
    if (res?.status === 409) emailRef.current?.focus();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {plan && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-rule bg-muted/50 px-3 py-2 text-xs text-ink-2">
          {t.rich("register.planNote", {
            plan,
            b: (chunks) => (
              <Badge kind="solid" mono>
                {chunks}
              </Badge>
            ),
          })}
        </p>
      )}

      <Field id="register-name" label={t("register.name")} error={message("name")}>
        {(a11y) => (
          <Input
            {...a11y}
            ref={nameRef}
            type="text"
            name="name"
            autoComplete="name"
            autoFocus
            value={values.name}
            onChange={(e) => set("name")(e.target.value)}
            onBlur={touch("name")}
            icon={<User size={15} strokeWidth={1.75} />}
          />
        )}
      </Field>

      <Field id="register-email" label={t("register.email")} error={message("email")}>
        {(a11y) => (
          <Input
            {...a11y}
            ref={emailRef}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            spellCheck={false}
            value={values.email}
            onChange={(e) => set("email")(e.target.value)}
            onBlur={touch("email")}
            icon={<Mail size={15} strokeWidth={1.75} />}
          />
        )}
      </Field>

      <PasswordField
        id="register-password"
        ref={passwordRef}
        label={t("register.password")}
        value={values.password}
        onChange={set("password")}
        onBlur={touch("password")}
        error={message("password")}
        hint={message("password") ? undefined : t("register.passwordHint")}
        autoComplete="new-password"
        strength
      />

      <FormError kind={error} />

      <Button type="submit" variant="primary" size="lg" loading={pending} className="group mt-1 w-full">
        {t("register.submit")}
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
          aria-hidden
        />
      </Button>

      <p className="text-center text-xs leading-relaxed text-ink-3">
        {t.rich("auth.consent", {
          terms: (chunks) => (
            <Link href="/terms" className="text-ink underline underline-offset-2 hover:text-ink-2">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/privacy" className="text-ink underline underline-offset-2 hover:text-ink-2">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}

"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Mail } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button, Field, Input } from "@/components/ui";
import { email as emailRule, hasErrors, required, validateAll } from "@/lib/validate";
import { FormError, errorKindFor, type FormErrorKind } from "./FormError";
import { PasswordField } from "./PasswordField";

type Props = {
  /** Validated return path (safeNext) or "/home"; the page decides. */
  next: string;
  /** False when ?demo=1 gave the focus to the demo button instead. */
  autoFocus?: boolean;
};

type Key = "email" | "password";

/** The demo password is four characters, so sign-in only asks for presence. */
const RULES = { email: emailRule, password: required } as const;

export function LoginForm({ next, autoFocus = true }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [values, setValues] = useState<Record<Key, string>>({ email: "", password: "" });
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<FormErrorKind | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Derived on every render: no effect, no stale copy of the errors.
  const errors = validateAll(values, RULES);
  const message = (key: Key) => (touched[key] && errors[key] ? t(`auth.validation.${errors[key]}`) : undefined);

  const set = (key: Key) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (error) setError(null);
  };
  const touch = (key: Key) => () => setTouched((x) => ({ ...x, [key]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setTouched({ email: true, password: true });
    if (hasErrors(errors)) {
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email.trim(), password: values.password }),
    }).catch(() => null);
    if (res?.ok) {
      router.replace(next);
      router.refresh();
      return;
    }
    setError(errorKindFor(res, "credentials"));
    setPending(false);
    passwordRef.current?.focus();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field id="login-email" label={t("login.email")} error={message("email")}>
        {(a11y) => (
          <Input
            {...a11y}
            ref={emailRef}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            autoFocus={autoFocus}
            value={values.email}
            onChange={(e) => set("email")(e.target.value)}
            onBlur={touch("email")}
            icon={<Mail size={15} strokeWidth={1.75} />}
          />
        )}
      </Field>

      <PasswordField
        id="login-password"
        ref={passwordRef}
        label={t("login.password")}
        value={values.password}
        onChange={set("password")}
        onBlur={touch("password")}
        error={message("password")}
        autoComplete="current-password"
      />

      <FormError kind={error} />

      <Button type="submit" variant="primary" size="lg" loading={pending} className="group mt-1 w-full">
        {t("login.submit")}
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
          aria-hidden
        />
      </Button>
    </form>
  );
}

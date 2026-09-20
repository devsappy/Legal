"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button, Disclosure } from "@/components/ui";
import { FormError, errorKindFor, type FormErrorKind } from "./FormError";

type Props = {
  /** The seeded account; passed from the server page (lib/auth is server-only). */
  demo: { email: string; password: string };
  /** Validated return path (safeNext) or "/home". */
  next: string;
  /** True when the visitor arrived via ?demo=1: the button takes focus. */
  autoFocus?: boolean;
};

/**
 * One click signs in with the demo account and continues to `next`. The
 * credentials stay visible in a disclosure so the shortcut is transparent
 * and anyone can type them into the form instead.
 */
export function DemoSignIn({ demo, next, autoFocus }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<FormErrorKind | null>(null);

  const signIn = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demo.email, password: demo.password }),
    }).catch(() => null);
    if (res?.ok) {
      router.replace(next);
      router.refresh();
      return;
    }
    setError(errorKindFor(res));
    setPending(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        loading={pending}
        autoFocus={autoFocus}
        onClick={signIn}
        className="group w-full"
      >
        <Sparkles size={16} strokeWidth={1.75} aria-hidden />
        {t("auth.demoContinue")}
        <ArrowRight
          size={15}
          className="text-ink-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
          aria-hidden
        />
      </Button>

      <FormError kind={error} />

      <Disclosure
        title={<span className="text-xs font-medium text-ink-2">{t("auth.demoDetails")}</span>}
        className="border-b-transparent"
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-rule bg-muted/50 px-3 py-2.5 font-mono text-xs">
          <dt className="text-ink-3">{t("login.email")}</dt>
          <dd className="select-all break-all text-ink">{demo.email}</dd>
          <dt className="text-ink-3">{t("login.password")}</dt>
          <dd className="select-all text-ink">{demo.password}</dd>
        </dl>
        <p className="mt-2 text-xs text-ink-3">{t("auth.demoHint")}</p>
      </Disclosure>
    </div>
  );
}

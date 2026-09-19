"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, KeyRound, Mail, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "@/i18n/navigation";

type Props = {
  /** Shown on the form so anyone can try the product without an account. */
  demo: { email: string; password: string };
};

export function LoginForm({ demo }: Props) {
  const t = useTranslations("login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setFailed(false);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);
    if (res?.ok) {
      router.replace("/ask");
      router.refresh();
      return;
    }
    setFailed(true);
    setPending(false);
  };

  const field =
    "h-11 w-full rounded-xl border bg-sheet pl-10 pr-3 text-[15px] text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-violet/60";

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block">
        <span className="block mb-1.5 text-[13px] font-medium text-ink-2">{t("email")}</span>
        <span className="relative block">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={demo.email}
            aria-invalid={failed || undefined}
            className={clsx(field, failed ? "border-seal/60" : "border-rule")}
          />
        </span>
      </label>

      <label className="block">
        <span className="block mb-1.5 text-[13px] font-medium text-ink-2">{t("password")}</span>
        <span className="relative block">
          <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            aria-invalid={failed || undefined}
            className={clsx(field, failed ? "border-seal/60" : "border-rule")}
          />
        </span>
      </label>

      {failed && (
        <p role="alert" className="rounded-lg border border-seal/30 bg-seal-soft px-3 py-2 text-[13px] text-ink">
          {t("error")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-paper text-[14.5px] font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {pending ? t("signingIn") : t("submit")}
        {!pending && <ArrowRight size={16} aria-hidden />}
      </button>

      {/* Demo account: one click fills the form, a second click signs in. */}
      <div className="rounded-xl border border-dashed border-violet/40 bg-violet-soft/50 p-3.5">
        <div className="flex items-center gap-2 text-[12.5px] font-medium text-violet mb-2">
          <Sparkles size={14} aria-hidden />
          {t("demoTitle")}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px] font-mono text-ink-2">
          <dt className="text-ink-3">{t("email")}</dt>
          <dd className="text-ink">{demo.email}</dd>
          <dt className="text-ink-3">{t("password")}</dt>
          <dd className="text-ink">{demo.password}</dd>
        </dl>
        <button
          type="button"
          onClick={() => {
            setEmail(demo.email);
            setPassword(demo.password);
            setFailed(false);
          }}
          className="mt-3 h-8 px-3 rounded-full border border-rule bg-sheet text-[12.5px] font-medium text-ink hover:border-violet/50 transition-colors"
        >
          {t("useDemo")}
        </button>
      </div>
    </form>
  );
}

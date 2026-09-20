"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, KeyRound, Mail, User } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "@/i18n/navigation";

/** Text input with a leading glyph. Lives at module scope so typing never remounts it. */
function Field({ icon: Icon, invalid, ...props }: { icon: typeof Mail; invalid: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="relative block">
      <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
      <input
        {...props}
        className={clsx(
          "h-11 w-full rounded-xl border bg-sheet pl-10 pr-3 text-[15px] text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-brand/60",
          invalid ? "border-seal/60" : "border-rule",
        )}
      />
    </span>
  );
}

export function RegisterForm() {
  const t = useTranslations("register");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"exists" | "invalid" | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { ok?: boolean; error?: "exists" | "invalid" } | null;
    if (data?.ok) {
      router.replace("/ask");
      router.refresh();
      return;
    }
    setError(data?.error ?? "invalid");
    setPending(false);
  };

  const invalid = error !== null;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block">
        <span className="block mb-1.5 text-[13px] font-medium text-ink-2">{t("name")}</span>
        <Field icon={User} invalid={invalid} name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block">
        <span className="block mb-1.5 text-[13px] font-medium text-ink-2">{t("email")}</span>
        <Field icon={Mail} invalid={invalid} type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block">
        <span className="block mb-1.5 text-[13px] font-medium text-ink-2">{t("password")}</span>
        <Field
          icon={KeyRound}
          invalid={invalid}
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span className="mt-1 block text-[12px] text-ink-3">{t("passwordHint")}</span>
      </label>
      {error && (
        <p role="alert" className="rounded-lg border border-seal/30 bg-seal-soft px-3 py-2 text-[13px] text-ink">
          {t(error)}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-paper text-[14.5px] font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {pending ? t("creating") : t("submit")}
        {!pending && <ArrowRight size={16} aria-hidden />}
      </button>
    </form>
  );
}

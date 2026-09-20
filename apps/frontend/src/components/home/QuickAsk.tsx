"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { askHref } from "@/lib/routes";
import { useHotkey } from "@/hooks/useHotkey";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Kbd } from "@/components/ui/Kbd";

/**
 * One field that hands a question to the assistant. Enter (or the button)
 * routes to /ask?q=…; ChatPanel is the only reader of ?q= and seeds its
 * composer with exactly this text. "/" focuses the field from anywhere on
 * the page, like the table search.
 */
export function QuickAsk() {
  const t = useTranslations("home");
  const router = useRouter();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const trimmed = value.trim();

  useHotkey("/", () => inputRef.current?.focus(), {
    id: "home.quickAsk",
    scope: "global",
    label: t("quickAskFocus"),
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!trimmed) return;
    router.push(askHref({ q: trimmed }));
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col gap-3">
      <label htmlFor={id} className="text-base font-medium text-ink">
        {t("quickAsk")}
      </label>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          id={id}
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("quickAskHint")}
          aria-label={t("quickAskLabel")}
          autoComplete="off"
          enterKeyHint="go"
          icon={<MessageSquareText size={16} strokeWidth={1.75} />}
          trailing={
            <span className="hidden sm:inline-flex" aria-hidden>
              <Kbd combo="enter" />
            </span>
          }
        />
        <Button type="submit" variant="primary" disabled={!trimmed} className="shrink-0">
          {t("quickAskSubmit")}
          <ArrowRight size={14} aria-hidden />
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { StatusIndicator } from "./StatusIndicator";
import { ThemeToggle } from "./ThemeToggle";

/**
 * What the signed-in area shows when the backend cannot say who is signed
 * in (network failure or 5xx): a minimal shell with the live health dot,
 * the explanation and a Retry that re-runs the server layout. Never a
 * bounce to /login, because the session may be perfectly valid.
 */
export function ServiceUnavailable() {
  const t = useTranslations();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const retry = () => {
    setBusy(true);
    router.refresh();
    // The refresh either replaces this tree or lands back here; either way re-enable after a moment.
    window.setTimeout(() => setBusy(false), 1500);
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden p-2 lg:p-2.5">
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-rule bg-sheet shadow-raised">
        <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-rule/70 px-3 sm:px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-md">
            <BrandMark />
            <span className="truncate text-base font-semibold tracking-tight text-ink">{t("app.name")}</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <StatusIndicator />
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>
        <main id="main" className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4">
          <EmptyState
            tone="error"
            title={t("errors.unavailableTitle")}
            description={t("errors.unavailableBody")}
            action={
              <Button variant="primary" onClick={retry} loading={busy}>
                <RefreshCw size={14} aria-hidden />
                {t("errors.retry")}
              </Button>
            }
            secondary={
              <Link href="/status" className={buttonClasses("ghost", "md")}>
                {t("shell.status")}
              </Link>
            }
          />
        </main>
      </div>
    </div>
  );
}

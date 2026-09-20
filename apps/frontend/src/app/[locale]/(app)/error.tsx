"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Error boundary for the signed-in area. The shell stays up (this sits
 * inside the layout), the page slot shows what happened with the digest
 * for support, and Try again re-renders the segment.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <EmptyState
        tone="error"
        title={t("title")}
        description={t("body")}
        action={
          <Button variant="primary" onClick={reset}>
            {t("retry")}
          </Button>
        }
        secondary={
          <Link href="/home" className={buttonClasses("ghost", "md")}>
            {t("home")}
          </Link>
        }
      />
      {error.digest && (
        <p className="mt-2 font-mono text-2xs text-ink-3" aria-live="polite">
          {t("digest", { digest: error.digest })}
        </p>
      )}
    </div>
  );
}

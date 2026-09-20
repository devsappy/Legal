"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

/** Error boundary for the admin segment: the tabs above stay, the page body becomes a retry. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("admin.errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-lg border border-dashed border-rule-strong">
      <EmptyState
        tone="error"
        title={t("crashed")}
        description={t("crashedBody")}
        action={
          <Button variant="primary" size="sm" onClick={reset}>
            <RefreshCw size={14} aria-hidden />
            {t("retry")}
          </Button>
        }
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function ReviewActions({ id, status }: { id: number; status: "open" | "resolved" }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const flip = async () => {
    setBusy(true);
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: status === "open" ? "resolved" : "open" }),
    }).catch(() => null);
    setBusy(false);
    router.refresh();
  };
  return (
    <Button size="sm" variant={status === "open" ? "primary" : "ghost"} disabled={busy} onClick={flip}>
      {status === "open" ? t("resolve") : t("reopen")}
    </Button>
  );
}

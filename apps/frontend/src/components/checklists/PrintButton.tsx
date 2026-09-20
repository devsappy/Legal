"use client";

import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Opens the print dialog; the print stylesheet hides the shell chrome and expands every step. */
export function PrintButton({ className }: { className?: string }) {
  const t = useTranslations("checklists");
  return (
    <Button size="sm" variant="outline" onClick={() => window.print()} className={className} data-print="hide">
      <Printer size={14} aria-hidden /> {t("print")}
    </Button>
  );
}

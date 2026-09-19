"use client";

import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";
import { JURISDICTIONS } from "@/lib/config";
import { useJurisdiction } from "./JurisdictionProvider";
import { Select } from "@/components/ui/Select";

/** Which Act the assistant answers from. Sits where a model picker would. */
export function JurisdictionSelect() {
  const t = useTranslations("nav");
  const { jurisdiction, setJurisdiction } = useJurisdiction();

  return (
    <Select
      aria-label={t("jurisdiction")}
      value={jurisdiction}
      onChange={(e) => setJurisdiction(e.target.value)}
      options={JURISDICTIONS.map((j) => ({ value: j.id, label: j.short }))}
      icon={<Scale size={14} strokeWidth={2} />}
      className="max-w-[11rem] sm:max-w-none"
    />
  );
}

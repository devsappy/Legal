"use client";

import { useTranslations } from "next-intl";
import { MessageSquareText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { askHref } from "@/lib/routes";

type Props = {
  procedure: string;
  n: number;
  step: string;
  jurisdiction: string;
  className?: string;
};

/** Hands one step to the assistant, phrased in the reader's language, against the procedure's Act. */
export function AskAboutStep({ procedure, n, step, jurisdiction, className }: Props) {
  const t = useTranslations("checklists");
  return (
    <Link
      href={askHref({ q: t("askStep", { procedure, n, step }), jurisdiction })}
      className={buttonClasses("ghost", "xs", className)}
      data-print="hide"
    >
      <MessageSquareText size={13} aria-hidden /> {t("askAbout")}
    </Link>
  );
}

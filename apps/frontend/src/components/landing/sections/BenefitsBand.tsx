import { getTranslations } from "next-intl/server";
import { BookOpenCheck, Languages, Scale, ShieldAlert } from "lucide-react";
import { LANGUAGES } from "@sahayak/shared";

/**
 * The ink band under the Acts strip: four promises, the last of which is
 * that every answer says it is not legal advice. Paper on ink, so it flips
 * with the theme.
 */
export async function BenefitsBand() {
  const t = await getTranslations("landing");
  const items = [
    { key: "cites", icon: BookOpenCheck, label: t("features.cites.title") },
    {
      key: "languages",
      icon: Languages,
      label: LANGUAGES.map((l, i) => (
        <span key={l.code}>
          {i > 0 && <span aria-hidden> · </span>}
          <span lang={l.code}>{l.native}</span>
        </span>
      )),
    },
    { key: "acts", icon: Scale, label: t("features.jurisdictions.title") },
    { key: "notice", icon: ShieldAlert, label: t("benefits.notice") },
  ];
  return (
    <div className="relative bg-brand text-primary-foreground">
      <ul className="mx-auto grid w-full max-w-[1400px] gap-x-6 gap-y-3 px-4 py-4 text-sm font-medium sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {items.map(({ key, icon: Icon, label }) => (
          <li key={key} className="flex min-w-0 items-center gap-3 lg:justify-center">
            <Icon size={18} strokeWidth={1.75} className="shrink-0 opacity-90" aria-hidden />
            <span className="truncate">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

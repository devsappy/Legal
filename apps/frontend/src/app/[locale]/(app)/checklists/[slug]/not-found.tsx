import { getTranslations } from "next-intl/server";
import { FileQuestion } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/** An unknown slug renders inside the shell with a way back, never a bare 404. */
export default async function ChecklistNotFound() {
  const t = await getTranslations("checklists");
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <EmptyState
        icon={<FileQuestion size={18} strokeWidth={1.75} />}
        title={t("notFoundTitle")}
        description={t("notFoundBody")}
        action={
          <Link href="/checklists" className={buttonClasses("primary", "sm")}>
            {t("back")}
          </Link>
        }
      />
    </div>
  );
}

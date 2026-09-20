import { getTranslations, setRequestLocale } from "next-intl/server";
import type { GlossaryRow } from "@sahayak/shared";
import { backendResult } from "@/lib/backend";
import { EmptyState, PageHeader } from "@/components/ui";
import { RetryButton } from "@/components/admin/AdminNav";
import { GlossaryTable } from "@/components/admin/glossary/GlossaryTable";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: `${t("terms.title")} · ${t("title")}` };
}

/**
 * Glossary editor. The client table owns the PageHeader so its count stays
 * live while terms are added and removed; ?add=1 opens the add form.
 */
export default async function GlossaryPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const [result, sp] = await Promise.all([backendResult<{ rows: GlossaryRow[] }>("/api/admin/glossary"), searchParams]);

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("terms.title")} description={t("terms.description")} />
        <div className="rounded-lg border border-dashed border-rule-strong">
          <EmptyState
            tone="error"
            title={t("errors.loadFailed")}
            description={t("errors.loadFailedBody")}
            action={<RetryButton>{t("errors.retry")}</RetryButton>}
          />
        </div>
      </div>
    );
  }

  return <GlossaryTable rows={result.data.rows} defaultAdding={sp.add === "1"} />;
}

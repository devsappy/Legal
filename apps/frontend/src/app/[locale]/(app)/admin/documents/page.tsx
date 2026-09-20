import { getTranslations, setRequestLocale } from "next-intl/server";
import type { DocumentRow } from "@sahayak/shared";
import { backendResult } from "@/lib/backend";
import { EmptyState, PageHeader } from "@/components/ui";
import { RetryButton } from "@/components/admin/AdminNav";
import { DocumentsTable } from "@/components/admin/documents/DocumentsTable";
import { IndexStatusCard } from "@/components/admin/documents/IndexStatusCard";
import { ReindexButton } from "@/components/admin/documents/ReindexButton";
import { UploadDialog } from "@/components/admin/documents/UploadDialog";

export const dynamic = "force-dynamic";

type DocumentsPayload = { rows: DocumentRow[]; sections: number; indexed: boolean; indexedAt?: string };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: `${t("corpus.title")} · ${t("title")}` };
}

/**
 * The corpus workbench: the honest index-status card, then every file the
 * assistant reads, grouped by Act. ?upload=1 opens the upload dialog
 * straight away (the overview's quick action links here).
 */
export default async function DocumentsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const [result, sp] = await Promise.all([backendResult<DocumentsPayload>("/api/admin/documents"), searchParams]);
  const openUpload = sp.upload === "1";

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("corpus.title")} description={t("corpus.description")} />
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

  const { rows, sections, indexed, indexedAt } = result.data;
  const untitled = rows.reduce((n, r) => n + r.untitled, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("corpus.title")}
        description={t("corpus.description")}
        count={rows.length}
        actions={
          <>
            <ReindexButton />
            <UploadDialog defaultOpen={openUpload} />
          </>
        }
      />
      <IndexStatusCard files={rows.length} sections={sections} untitled={untitled} indexed={indexed} indexedAt={indexedAt ?? null} />
      <DocumentsTable rows={rows} />
    </div>
  );
}

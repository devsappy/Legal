import { getTranslations, setRequestLocale } from "next-intl/server";
import type { DocumentRow, GlossaryRow, ReviewRow } from "@sahayak/shared";
import { backendResult } from "@/lib/backend";
import { sqliteDate } from "@/lib/admin-api";
import { PageHeader } from "@/components/ui";
import { RetryButton } from "@/components/admin/AdminNav";
import { OverviewStats } from "@/components/admin/overview/OverviewStats";
import { AttentionList } from "@/components/admin/overview/AttentionList";
import { SystemHealth } from "@/components/admin/overview/SystemHealth";
import { QuickActions } from "@/components/admin/overview/QuickActions";

export const dynamic = "force-dynamic";

type DocumentsPayload = { rows: DocumentRow[]; sections: number; indexed: boolean; indexedAt?: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: `${t("overview.title")} · ${t("title")}` };
}

/**
 * The console's front page: four numbers, what needs attention, live health
 * and quick actions. Health is never awaited here (it renders client-side
 * from the health store); the three admin lists load in parallel and each
 * degrades on its own when the backend is down.
 */
export default async function AdminOverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const [reviews, documents, glossary] = await Promise.all([
    backendResult<{ rows: ReviewRow[] }>("/api/admin/reviews"),
    backendResult<DocumentsPayload>("/api/admin/documents"),
    backendResult<{ rows: GlossaryRow[] }>("/api/admin/glossary"),
  ]);

  const open = reviews.ok
    ? reviews.data.rows
        .filter((r) => r.status === "open")
        .sort((a, b) => sqliteDate(b.created_at).getTime() - sqliteDate(a.created_at).getTime())
    : null;

  const numbers = {
    open: open ? open.length : null,
    files: documents.ok ? documents.data.rows.length : null,
    sections: documents.ok ? documents.data.sections : null,
    terms: glossary.ok ? glossary.data.rows.length : null,
    indexed: documents.ok ? documents.data.indexed : null,
    indexedAt: documents.ok ? (documents.data.indexedAt ?? null) : null,
  };
  const anyFailed = !reviews.ok || !documents.ok || !glossary.ok;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader title={t("overview.title")} description={t("overview.description")} />

      {anyFailed && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-seal/40 bg-sheet px-4 py-3 text-sm"
        >
          <div>
            <p className="font-medium text-seal">{t("errors.loadFailed")}</p>
            <p className="text-ink-2">{t("errors.loadFailedBody")}</p>
          </div>
          <RetryButton variant="outline">{t("errors.retry")}</RetryButton>
        </div>
      )}

      <OverviewStats n={numbers} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <AttentionList rows={open ? open.slice(0, 5) : null} total={numbers.open} />
        <SystemHealth />
      </div>

      <QuickActions />
    </div>
  );
}

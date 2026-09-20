import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReviewRow } from "@sahayak/shared";
import { backendResult } from "@/lib/backend";
import { EmptyState, PageHeader } from "@/components/ui";
import { RetryButton } from "@/components/admin/AdminNav";
import { ReviewQueue } from "@/components/admin/reviews/ReviewQueue";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: `${t("reviews.title")} · ${t("title")}` };
}

/** Rebuilds the request's query string so the client store can render a deep link without a flash. */
function queryString(sp: Record<string, string | string[] | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
    else if (Array.isArray(v)) for (const x of v) qs.append(k, x);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function QueriesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const [result, sp] = await Promise.all([backendResult<{ rows: ReviewRow[] }>("/api/admin/reviews"), searchParams]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("reviews.title")} description={t("reviews.description")} count={result.ok ? result.data.rows.length : undefined} />
      {result.ok ? (
        <ReviewQueue rows={result.data.rows} initialSearch={queryString(sp)} />
      ) : (
        <div className="rounded-lg border border-dashed border-rule-strong">
          <EmptyState
            tone="error"
            title={t("errors.loadFailed")}
            description={t("errors.loadFailedBody")}
            action={<RetryButton>{t("errors.retry")}</RetryButton>}
          />
        </div>
      )}
    </div>
  );
}

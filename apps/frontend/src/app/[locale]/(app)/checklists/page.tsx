import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Checklist } from "@sahayak/shared";
import { backendResult } from "@/lib/backend";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { ProcedureFilters, ProceduresUnavailable } from "@/components/checklists/ProcedureFilters";

/** Shown while the client filters hydrate under Suspense (useSearchParams). */
function GridSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checklists" });
  return { title: t("title") };
}

export default async function ChecklistsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checklists");
  const tNav = await getTranslations("nav");
  const result = await backendResult<{ procedures: Checklist[] }>("/api/procedures");
  const procedures = result.ok ? (result.data.procedures ?? []) : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        count={result.ok ? procedures.length : undefined}
        breadcrumbs={[{ label: tNav("home"), href: "/home" }, { label: t("title") }]}
        className="mb-8"
      />

      {result.ok ? (
        <Suspense fallback={<GridSkeleton />}>
          <ProcedureFilters procedures={procedures} />
        </Suspense>
      ) : (
        <ProceduresUnavailable title={t("unavailable")} description={t("unavailableBody")} />
      )}
    </div>
  );
}

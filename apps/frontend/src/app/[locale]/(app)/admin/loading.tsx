import { Skeleton, SkeletonRows } from "@/components/ui";

/** Shown while a force-dynamic admin page fetches: a PageHeader outline and a table. */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="rounded-lg border border-rule bg-sheet">
        <SkeletonRows rows={6} cols={5} />
      </div>
    </div>
  );
}

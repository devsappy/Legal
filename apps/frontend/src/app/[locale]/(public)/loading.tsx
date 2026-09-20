import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

/**
 * Shown while a public page's server data is on its way: the hero's shape
 * (eyebrow, title, subtitle, two buttons) beside an empty app-window frame,
 * so the layout does not jump when the real page lands. All bars are
 * aria-hidden; the region carries aria-busy instead.
 */
export default function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-14 sm:px-8 sm:py-20" aria-busy="true">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
        <div className="max-w-[560px]">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-6 h-10 w-full" />
          <Skeleton className="mt-2 h-10 w-10/12" />
          <Skeleton className="mt-2 h-10 w-7/12" />
          <div className="mt-6">
            <SkeletonText lines={2} />
          </div>
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-10 w-40 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-rule-strong bg-sheet">
          <div className="flex h-9 items-center gap-1.5 border-b border-rule px-3">
            <span className="size-2.5 rounded-full border border-rule-strong" aria-hidden />
            <span className="size-2.5 rounded-full border border-rule-strong" aria-hidden />
            <span className="size-2.5 rounded-full border border-rule-strong" aria-hidden />
          </div>
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex gap-1.5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-6 w-14 rounded-md" />
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
            <SkeletonText lines={5} />
            <div className="flex flex-col gap-2 border-t border-rule pt-3">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

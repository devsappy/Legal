import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

/** Route-level skeleton for a procedure: crumbs, title, a timeline and the aside. */
export default function ChecklistLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10" aria-busy>
      <div className="mb-8 flex flex-col gap-3">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-3/4 max-w-[28rem]" />
        <Skeleton className="h-3.5 w-full max-w-[60ch]" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <ol className="relative ml-3.5 space-y-8 border-l border-rule">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="relative -ml-[15px] flex items-start gap-3">
              <Skeleton className="size-7 shrink-0 rounded-full" />
              <div className="flex-1 pt-1">
                <Skeleton className="mb-2 h-4 w-2/3" />
                <SkeletonText lines={2} />
              </div>
            </li>
          ))}
        </ol>
        <div className="rounded-lg border border-rule bg-sheet p-4">
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="mb-5 h-1.5 w-full rounded-full" />
          <Skeleton className="mb-2 h-3 w-24" />
          <SkeletonText lines={3} />
        </div>
      </div>
    </div>
  );
}

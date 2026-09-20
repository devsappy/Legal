import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

/** Route-level skeleton for /checklists: header, chip row and a card grid. */
export default function ChecklistsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10" aria-busy>
      <div className="mb-8 flex flex-col gap-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3.5 w-full max-w-[60ch]" />
      </div>
      <div className="mb-6 flex flex-wrap gap-1.5">
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

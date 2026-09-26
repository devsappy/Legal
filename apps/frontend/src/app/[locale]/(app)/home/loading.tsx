import { Card } from "@/components/ui/Card";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

/*
 * Placeholder cards in the same order and the same grid as the page, so the
 * layout does not jump when the data arrives.
 */
function Rows({ n = 3 }: { n?: number }) {
  return (
    <span className="mt-4 flex flex-col gap-3" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <span className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </span>
        </span>
      ))}
    </span>
  );
}

export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8" aria-busy>
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-3 h-7 w-2/3 max-w-sm" />
      <span className="mt-5 flex flex-wrap gap-6" aria-hidden>
        <Skeleton className="h-5 w-36 rounded-full" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </span>

      <div className="mt-6 flex flex-col gap-4">
        <Card>
          <Skeleton className="h-4 w-32" />
          <span className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center" aria-hidden>
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 w-full sm:w-24" />
          </span>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <Skeleton className="h-4 w-48" />
            <Rows n={4} />
          </Card>
          <Card>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-40" />
            <span className="mt-4 block" aria-hidden>
              <SkeletonText lines={4} />
            </span>
          </Card>
          <Card>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Rows n={3} />
          </Card>
          <Card>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-24" />
            <Skeleton className="mt-4 h-5 w-32 rounded-full" />
            <span className="mt-4 flex flex-col gap-3" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="flex items-center gap-3">
                  <Skeleton className="size-2 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="ml-auto h-3 w-8" />
                </span>
              ))}
            </span>
          </Card>
        </div>

        <Card padded={false} className="overflow-hidden">
          <span className="grid grid-cols-2 gap-px bg-rule-strong sm:grid-cols-4" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="flex flex-col justify-center bg-sheet p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-6 w-16" />
              </span>
            ))}
          </span>
        </Card>

        <Card>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-5 w-14 rounded-full" />
          <Skeleton className="mt-3 h-3.5 w-3/4" />
          <span className="mt-2 block" aria-hidden>
            <SkeletonText lines={3} />
          </span>
        </Card>
      </div>
    </div>
  );
}

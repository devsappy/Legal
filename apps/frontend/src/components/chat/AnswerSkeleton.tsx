import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Three bars where the answer will land, shown from send until the first
 * token so the reader sees the shape of what is coming instead of a gap.
 * aria-hidden through Skeleton; the transcript's StreamStatus does the talking.
 */
export function AnswerSkeleton() {
  return (
    <div className="max-w-[68ch] space-y-2.5 py-1" aria-hidden data-motion>
      <Skeleton className="h-3.5 w-11/12" />
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3.5 w-3/5" />
    </div>
  );
}

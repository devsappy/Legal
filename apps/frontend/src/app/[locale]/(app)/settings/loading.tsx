import { SkeletonCard } from "@/components/ui/Skeleton";

/** Placeholder cards while a settings page renders; the header and nav come from the layout. */
export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

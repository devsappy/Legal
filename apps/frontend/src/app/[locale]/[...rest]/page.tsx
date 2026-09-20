import { notFound } from "next/navigation";

/**
 * Catch-all under the locale segment: any path no route claims renders
 * the localised [locale]/not-found.tsx (inside the locale layout) instead
 * of the bare root 404.
 */
export default function CatchAllPage() {
  notFound();
}

/**
 * When the privacy policy and terms of use were last changed (ISO date).
 * Bump it in the same change as the copy in messages/*.json; both legal
 * pages render it inside <time dateTime=…> formatted for the locale.
 */
export const LEGAL_UPDATED = "2026-09-20";

export type LegalKind = "privacy" | "terms";

/** The other document, for the "Also read" cross-link. */
export function otherLegal(kind: LegalKind): LegalKind {
  return kind === "privacy" ? "terms" : "privacy";
}

/**
 * A stable, URL-safe id for a section heading in any script. Letters, marks
 * and digits of every script are kept (Devanagari and Tamil headings stay
 * readable in the hash); everything else collapses to a hyphen. The index
 * prefix keeps ids unique even when two headings slugify alike.
 */
export function headingId(heading: string, index: number): string {
  const slug = heading
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `s${index + 1}-${slug}` : `s${index + 1}`;
}

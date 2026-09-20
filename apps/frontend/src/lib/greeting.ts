/**
 * Time-of-day greeting for the Home tile. Pure (no React) so the server
 * page can render its own guess and the client can correct it from the
 * visitor's clock through hooks/useNow.
 */
export type TimeOfDay = "morning" | "afternoon" | "evening";

const MINUTE = 60_000;

/** The clock rounded down to the minute — what useNow() reports, for a server page to pass as `serverNow`. */
export function currentMinute(): number {
  return Math.floor(Date.now() / MINUTE) * MINUTE;
}

/** Morning until noon, afternoon until five, evening after that (night counts as evening). */
export function timeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** "Priya Deshmukh" -> "Priya"; a single-word name comes back whole. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** The local calendar date as YYYY-MM-DD for a <time dateTime>. */
export function localIsoDate(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** A long date with the weekday, Latin digits in every locale: "Sunday, 20 September 2026". */
export function formatLongDate(ts: number, locale: string): string {
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(ts);
}

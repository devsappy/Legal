/**
 * Locale-aware formatting. Digits stay Latin ("latn") in every language so
 * section numbers, counts and times read the same in Hindi, Marathi and
 * Tamil as they do in English; the words around them are translated by Intl.
 */
const NUMBERING = "-u-nu-latn";

function tag(locale: string) {
  return `${locale}${NUMBERING}`;
}

function toMs(ts: number | string | Date): number {
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "number") return ts;
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? Number(ts) : parsed;
}

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400_000],
  ["month", 30 * 86_400_000],
  ["week", 7 * 86_400_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "2 hours ago", "in 3 days", "now" — via Intl.RelativeTimeFormat with numeric: auto ("yesterday"). */
export function relativeTime(ts: number | string | Date, locale: string, now = Date.now()): string {
  const diff = toMs(ts) - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(tag(locale), { numeric: "auto", style: "long" });
  if (abs < 45_000) return rtf.format(0, "second");
  for (const [unit, ms] of RELATIVE_STEPS) {
    if (abs >= ms || unit === "minute") return rtf.format(Math.round(diff / ms), unit);
  }
  return rtf.format(Math.round(diff / 60_000), "minute");
}

/** "20 Sept 2026" (medium), "20/09/2026" (short), "20 September 2026" (long). */
export function formatDate(ts: number | string | Date, locale: string, style: "short" | "medium" | "long" = "medium"): string {
  return new Intl.DateTimeFormat(tag(locale), { dateStyle: style }).format(toMs(ts));
}

/** Date and time on one line, e.g. "20 Sept 2026, 14:05". */
export function formatDateTime(ts: number | string | Date, locale: string): string {
  return new Intl.DateTimeFormat(tag(locale), { dateStyle: "medium", timeStyle: "short" }).format(toMs(ts));
}

/** Time only, "14:05". */
export function formatTime(ts: number | string | Date, locale: string): string {
  return new Intl.DateTimeFormat(tag(locale), { timeStyle: "short" }).format(toMs(ts));
}

/** Grouped integers and decimals with Latin digits: 12,340 in every locale. */
export function formatNumber(n: number, locale: string, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(tag(locale), { maximumFractionDigits: 0, ...opts }).format(n);
}

/** A percentage from a 0..1 ratio: 0.874 -> "87%". */
export function formatPercent(ratio: number, locale: string): string {
  return new Intl.NumberFormat(tag(locale), { style: "percent", maximumFractionDigits: 0 }).format(ratio);
}

/** Elapsed time for traces and toasts: 1_240 -> "1.2s", 12_400 -> "12.4s", 95_000 -> "1m 35s". */
export function formatSeconds(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0s";
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/** Bytes for upload previews: 24_576 -> "24 KB". */
export function formatBytes(bytes: number, locale: string): string {
  if (bytes < 1024) return `${formatNumber(bytes, locale)} B`;
  if (bytes < 1024 * 1024) return `${formatNumber(bytes / 1024, locale)} KB`;
  return `${formatNumber(bytes / (1024 * 1024), locale, { maximumFractionDigits: 1 })} MB`;
}

import { downloadText } from "./export";

/**
 * Client-side CSV for admin exports. RFC 4180 quoting (double quotes, CRLF),
 * a UTF-8 BOM so Excel opens Devanagari and Tamil correctly, and a leading
 * apostrophe on cells that would otherwise be read as a formula.
 */
export type CsvCell = string | number | boolean | null | undefined;

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Neutralise spreadsheet formula injection ("=HYPERLINK(...)" and friends).
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Builds the file text from a header row and data rows. */
export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(escapeCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Triggers a download of the CSV; no-op on the server. */
export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]): void {
  downloadText(filename.endsWith(".csv") ? filename : `${filename}.csv`, toCsv(headers, rows), "text/csv;charset=utf-8");
}

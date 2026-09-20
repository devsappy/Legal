import { LOCALES } from "@sahayak/shared";

/**
 * Request header the proxy sets to the locale-relative path (+ query) of the
 * page being served; the (app) layout reads it to build `/login?next=`.
 */
export const PATHNAME_HEADER = "x-pathname";

/** Longer than any route in the app; anything beyond this is not a return path. */
const MAX_LENGTH = 2048;

/**
 * Validates a `?next=` return path from a sign-in link. Only a same-origin,
 * locale-relative path is accepted: it must start with a single "/", and
 * it must not carry a scheme, a protocol-relative "//" host, a backslash
 * (browsers normalise "\" to "/"), or control characters. A leading locale
 * segment ("/en/checklists") is stripped because the next-intl router adds
 * the current locale itself.
 *
 * Returns the path (with its query and hash) or null when it is not safe;
 * callers fall back to "/home".
 */
export function safeNext(v: string | null | undefined): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.length > MAX_LENGTH) return null;
  if (!s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\")) return null;
  // Backslashes and control characters never belong in an in-app path.
  if (/[\\\u0000-\u001f\u007f]/.test(s)) return null;
  // A percent-encoded "//" or "\" would come back after the router decodes it.
  let decoded: string;
  try {
    decoded = decodeURIComponent(s);
  } catch {
    return null;
  }
  if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded)) return null;
  // "/http:evil" is still a path, but "/en:..." style tricks are not worth allowing:
  // reject a colon before the first slash of the path body.
  if (/^\/[^/?#]*:/.test(s)) return null;

  const stripped = stripLocale(s);
  return stripped;
}

/** "/en/checklists/x" -> "/checklists/x", "/en" -> "/". Other paths are returned as is. */
function stripLocale(path: string): string {
  for (const locale of LOCALES) {
    const prefix = `/${locale}`;
    if (path === prefix) return "/";
    if (path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`) || path.startsWith(`${prefix}#`)) {
      const rest = path.slice(prefix.length);
      return rest.startsWith("/") ? rest : `/${rest}`;
    }
  }
  return path;
}

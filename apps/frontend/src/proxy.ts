import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { PATHNAME_HEADER } from "./lib/next-path";
import { isPrivatePath } from "./lib/routes";

const intl = createMiddleware(routing);

/** Set by the backend on sign-in; presence only, the (app) layout validates it. */
const SESSION_COOKIE = "coop_session";

const localePattern = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

/**
 * "/en/checklists/x" -> { locale: "en", path: "/checklists/x" };
 * an unprefixed path keeps the default locale so the redirect below is still localised.
 */
function splitLocale(pathname: string): { locale: string; path: string } {
  const m = pathname.match(localePattern);
  if (!m) return { locale: routing.defaultLocale, path: pathname };
  const rest = pathname.slice(m[0].length);
  return { locale: m[1], path: rest === "" ? "/" : rest };
}

/**
 * next-intl's locale handling plus the sign-in gate: an anonymous visitor
 * on a private route is sent to the localised /login with `?next=` so the
 * deep link keeps its promise after sign-in (auth-legal's safeNext validates
 * it on the way back). The gate only looks for the cookie; the (app) layout
 * still asks the backend whether the session is valid.
 */
export default function proxy(req: NextRequest) {
  const { locale, path } = splitLocale(req.nextUrl.pathname);

  if (isPrivatePath(path) && !req.cookies.get(SESSION_COOKIE)?.value) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.search = "";
    const next = `${path}${req.nextUrl.search}`;
    if (next !== "/home") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  const headers = new Headers(req.headers);
  headers.set(PATHNAME_HEADER, `${path}${req.nextUrl.search}`);
  return intl(new NextRequest(req, { headers }));
}

export const config = {
  // Skip API routes, Next internals, static files and the root metadata
  // routes (/icon and /apple-icon carry no extension, so they are named).
  matcher: "/((?!api|_next|_vercel|icon|apple-icon|manifest.webmanifest|sitemap.xml|robots.txt|.*\\..*).*)",
};

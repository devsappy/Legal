import { House, ListChecks, MessageSquareText, Settings2, ShieldCheck, type LucideIcon } from "lucide-react";
import type { UserRole } from "@sahayak/shared";

/**
 * The one map of signed-in destinations. The sidebar, rail, breadcrumbs,
 * command palette and sitemap all read from here so a new route cannot go
 * missing in one language or one surface.
 */
export type AppRouteKey = "home" | "ask" | "checklists" | "settings" | "admin";

export type AppRoute = {
  key: AppRouteKey;
  href: string;
  /** Key under the `nav` namespace for the label. */
  navKey: string;
  icon: LucideIcon;
  /** Omitted means every signed-in role. */
  roles?: UserRole[];
  match: (pathname: string) => boolean;
};

const exact = (href: string) => (pathname: string) => pathname === href;
const prefix = (href: string) => (pathname: string) => pathname === href || pathname.startsWith(`${href}/`);

export const APP_ROUTES: AppRoute[] = [
  { key: "home", href: "/home", navKey: "home", icon: House, match: exact("/home") },
  { key: "ask", href: "/ask", navKey: "chat", icon: MessageSquareText, match: exact("/ask") },
  { key: "checklists", href: "/checklists", navKey: "checklists", icon: ListChecks, match: prefix("/checklists") },
  { key: "settings", href: "/settings", navKey: "settings", icon: Settings2, match: prefix("/settings") },
  { key: "admin", href: "/admin", navKey: "admin", icon: ShieldCheck, roles: ["admin"], match: prefix("/admin") },
];

/** Routes a user of this role may see, in sidebar order. */
export function routesFor(role?: UserRole): AppRoute[] {
  return APP_ROUTES.filter((r) => !r.roles || (role !== undefined && r.roles.includes(role)));
}

/** The route whose section the pathname is in, if any. */
export function routeFor(pathname: string): AppRoute | undefined {
  return APP_ROUTES.find((r) => r.match(pathname));
}

/** Locale-relative paths that render without a session. */
export const PUBLIC_PATHS = ["/", "/login", "/register", "/privacy", "/terms", "/changelog", "/status"] as const;

/** Prefixes that require sign-in; the proxy sends anonymous visitors to /login?next=. */
export const PRIVATE_PREFIXES = ["/home", "/ask", "/checklists", "/settings", "/admin"] as const;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * A link into the assistant. ChatPanel reads ?q= once and seeds the
 * composer; ?jurisdiction= selects the Act first. Both are encoded here
 * and nowhere else.
 */
export function askHref(opts?: { q?: string; jurisdiction?: string }): string {
  const params = new URLSearchParams();
  const q = opts?.q?.trim();
  if (q) params.set("q", q);
  if (opts?.jurisdiction) params.set("jurisdiction", opts.jurisdiction);
  const query = params.toString();
  return query ? `/ask?${query}` : "/ask";
}

/** Sign-in that returns to `next` afterwards; auth-legal's safeNext() validates it on the way back. */
export function loginHref(next: string): string {
  return next && next !== "/home" ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

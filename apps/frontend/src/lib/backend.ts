import { headers } from "next/headers";

/**
 * Server-side client for the API. Pages and layouts call this to read data the
 * backend owns (session, procedures, admin tables); the browser reaches the same
 * routes through the /api/* rewrite in next.config.ts.
 */
export const BACKEND_URL = (process.env.BACKEND_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");

/** GET as the signed-in user (the request's cookie is forwarded). Null when the backend is down or says no. */
export async function backend<T>(path: string): Promise<T | null> {
  const cookie = (await headers()).get("cookie") ?? "";
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { headers: { cookie }, cache: "no-store" });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** GET a public route without cookies; cached briefly so the landing page stays static-ish. */
export async function backendPublic<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { next: { revalidate } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

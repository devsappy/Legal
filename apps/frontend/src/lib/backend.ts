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

/* ---- result variants: pages branch on status instead of getting a bare null ---- */

/**
 * Outcome of a backend call. `ok: false` carries the HTTP status (401 -> sign
 * in, 404 -> not found, 5xx -> the model server may still be starting) or
 * "network" when nothing answered, plus the parsed error body when there is one.
 */
export type BackendResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number | "network"; body?: unknown };

async function toResult<T>(res: Response): Promise<BackendResult<T>> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  return res.ok ? { ok: true, status: res.status, data: body as T } : { ok: false, status: res.status, body };
}

/** GET as the signed-in user; never throws. */
export async function backendResult<T>(path: string): Promise<BackendResult<T>> {
  const cookie = (await headers()).get("cookie") ?? "";
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { headers: { cookie }, cache: "no-store" });
    return await toResult<T>(res);
  } catch {
    return { ok: false, status: "network" };
  }
}

/** GET a public route without cookies, cached briefly; never throws. */
export async function backendPublicResult<T>(path: string, revalidate = 60): Promise<BackendResult<T>> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { next: { revalidate } });
    return await toResult<T>(res);
  } catch {
    return { ok: false, status: "network" };
  }
}

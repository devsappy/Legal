import { cache } from "react";
import type { SessionUser } from "@sahayak/shared";
import { backend } from "./backend";

export type { SessionUser };

/** Shown on the sign-in page; the backend seeds this account on first run. */
export const DEMO_ACCOUNT = { email: "test@gmail.com", password: "1234" } as const;

/** Who is signed in, from the backend's /api/auth/me. Cached per request so layout and page ask once. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const res = await backend<{ ok: boolean; user: SessionUser | null }>("/api/auth/me");
  return res?.user ?? null;
});

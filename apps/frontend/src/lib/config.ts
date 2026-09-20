/**
 * Where answers come from:
 *  - NEXT_PUBLIC_API_URL set      → the browser talks to that backend directly (needs CORS_ORIGIN on the backend)
 *  - NEXT_PUBLIC_CHAT_MODE=mock   → the canned stream in /api/mock/chat (no backend or model needed)
 *  - otherwise                    → /api/*, proxied by next.config.ts to the backend (BACKEND_URL)
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const CHAT_ENDPOINT = API_URL
  ? `${API_URL}/api/chat`
  : process.env.NEXT_PUBLIC_CHAT_MODE === "mock"
    ? "/api/mock/chat"
    : "/api/chat";

export { DEFAULT_JURISDICTION, JURISDICTIONS, LANGUAGES, LOCALES, type Jurisdiction, type Locale } from "@sahayak/shared";

export const JURISDICTION_STORAGE_KEY = "coop.jurisdiction";
export const SESSION_STORAGE_KEY = "coop.session";

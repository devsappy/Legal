import type { GlossaryRow, ReviewRow } from "@sahayak/shared";
import { API_URL } from "./config";

/**
 * Typed browser client for the admin routes. Every call checks `res.ok`
 * and throws an ApiError carrying the HTTP status and the backend's error
 * code (`exists`, `type`, `invalid`, `ingest`, …), so callers can branch on
 * a 409 without parsing bodies themselves. Never used from server components.
 */
export class ApiError extends Error {
  constructor(
    public status: number | "network",
    public code: string,
    public detail?: string,
  ) {
    super(detail ?? `${code} (${status})`);
    this.name = "ApiError";
  }
}

const BASE = `${API_URL}/api/admin`;

type ErrorBody = { ok?: boolean; error?: string; detail?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { cache: "no-store", ...init });
  } catch {
    throw new ApiError("network", "network");
  }
  let body: unknown = undefined;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  if (!res.ok) {
    const b = (body ?? {}) as ErrorBody;
    throw new ApiError(res.status, b.error ?? String(res.status), b.detail);
  }
  return body as T;
}

const json = (method: string, data: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

/**
 * SQLite's datetime('now') is UTC without a zone marker ("2026-09-20 10:15:00");
 * Date.parse would read it as local time. ISO strings pass through unchanged.
 */
export function sqliteDate(value: string): Date {
  const s = value.trim();
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s) ? `${s.replace(" ", "T")}Z` : s;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

export type ReviewStatus = ReviewRow["status"];
export type GlossaryDraft = Omit<GlossaryRow, "id">;

export type UploadResult = { ok: true; file: string; sections: number | null };
export type ReindexResult = {
  ok: true;
  sections: number;
  embedded: number;
  seconds: number;
  /** Set when the embedding server was unreachable and only BM25 is available. */
  note: string | null;
  indexedAt?: string;
};

export const reviews = {
  /** Flips one or many reviews in a single request; resolves to how many rows changed. */
  async setStatus(ids: number[], status: ReviewStatus): Promise<number> {
    const r = await request<{ ok: true; updated: number }>("/reviews", json("PATCH", { ids, status }));
    return r.updated;
  },
};

export const glossary = {
  /** Resolves to the new row's id. Throws ApiError(409, "exists") for a duplicate term. */
  async create(draft: GlossaryDraft): Promise<number> {
    const r = await request<{ ok: true; id: number }>("/glossary", json("POST", draft));
    return r.id;
  },
  async update(row: GlossaryRow): Promise<void> {
    await request<{ ok: true }>("/glossary", json("PUT", row));
  },
  async remove(id: number): Promise<void> {
    await request<{ ok: true }>(`/glossary?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

export const documents = {
  /**
   * Uploads an Act. Uses XMLHttpRequest so the caller can watch the upload
   * itself (fetch has no upload progress); `onProgress` is 0..1 and reaches 1
   * before the backend starts converting. Same ApiError contract as the rest.
   */
  upload(form: FormData, opts: { onProgress?: (ratio: number) => void; signal?: AbortSignal } = {}): Promise<UploadResult> {
    return new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE}/documents`);
      xhr.responseType = "json";
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && opts.onProgress) opts.onProgress(Math.min(1, e.loaded / e.total));
      };
      xhr.onerror = () => reject(new ApiError("network", "network"));
      xhr.onabort = () => reject(new ApiError("network", "aborted"));
      xhr.onload = () => {
        const body = (xhr.response ?? {}) as ErrorBody & Partial<UploadResult>;
        if (xhr.status >= 200 && xhr.status < 300 && body.ok) {
          resolve({ ok: true, file: body.file ?? "", sections: body.sections ?? null });
        } else {
          reject(new ApiError(xhr.status, body.error ?? String(xhr.status), body.detail));
        }
      };
      if (opts.signal) {
        if (opts.signal.aborted) return reject(new ApiError("network", "aborted"));
        opts.signal.addEventListener("abort", () => xhr.abort(), { once: true });
      }
      xhr.send(form);
    });
  },
  /** Rebuilds the vector index; can take a minute on a large corpus. */
  reindex(): Promise<ReindexResult> {
    return request<ReindexResult>("/reindex", { method: "POST" });
  },
};

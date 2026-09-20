# Sahakar Sahayak

Multilingual (English, Hindi, Marathi, Tamil) assistant for Indian cooperative-society
law. Answers come from a local model, grounded in the text of six Acts, and every answer
cites the sections it relies on.

## Layout

```
apps/frontend    Next.js 16 UI (port 3000). Talks to the backend over HTTP only.
apps/backend     Hono API on Node (port 4000): auth, chat pipeline, RAG, Postgres, admin.
                 Also owns the corpus, ingestion scripts, model launchers and the eval set.
packages/shared  Types and config both sides use (locales, jurisdictions, SSE contract).
```

Both apps are npm workspaces; run `npm install` once at the root.

## Run locally

```bash
npm install
cp apps/backend/.env.example apps/backend/.env   # paste your Supabase DATABASE_URL
npm run dev            # everything in one terminal: chat model, embedding server, API, UI
```

`npm run dev` starts four processes (`concurrently`): the chat model server on :8080
(llama.cpp, downloads Qwen3.5-4B on first run), the embedding server on :8081 (bge-m3),
the API on http://127.0.0.1:4000 and the UI on http://localhost:3000. If the model
servers are already running, `npm run dev:apps` starts just the API and the UI; each
piece is also available on its own (`npm run llm`, `npm run embed`, `npm run dev:backend`,
`npm run dev:frontend`).

`npm run llm` / `npm run embed` need llama.cpp (`winget install llama.cpp` on Windows; see
`apps/backend/scripts/*.ps1` for the flags). Sign in with the demo admin
`test@gmail.com` / `1234`, or register a member account.

The browser only ever talks to the frontend: `next.config.ts` rewrites `/api/*` to the
backend (`BACKEND_URL`, default `http://127.0.0.1:4000`), so the session cookie stays on
one origin. Server components read from the backend directly with the same variable.

| Route | What it is |
|---|---|
| `/{locale}` | Landing page |
| `/{locale}/login`, `/register` | Sign in / create account |
| `/{locale}/ask` | The assistant |
| `/{locale}/checklists` | Step-by-step procedures |
| `/{locale}/admin/*` | Documents, glossary, review queue (admin role) |
| `/{locale}/privacy`, `/terms` | Legal pages |

## API (backend)

| Method, path | Purpose |
|---|---|
| `POST /api/auth/login`, `/register`, `/logout`; `GET /api/auth/me` | Cookie sessions |
| `POST /api/chat` | Streams an answer as SSE (`meta`, `citations`, `token`, `done`, `error`) |
| `POST /api/chat/:id/feedback` | Thumbs up/down |
| `GET/PUT/DELETE /api/conversations` | The user's saved conversations |
| `GET /api/procedures`, `/api/procedures/:slug` | Checklists |
| `GET /api/stats`, `GET /api/health` | Landing-page numbers; liveness of DB, model, index |
| `/api/admin/documents`, `/reindex`, `/glossary`, `/reviews` | Admin only |

## How an answer is produced

`apps/backend/src/routes/chat.ts`:

1. **Triage** — one grammar-constrained JSON call: language, intent, escalation, and
   English search terms (so a Hindi question still finds English statute text).
2. **Retrieve** — BM25 (`lib/rag/search.ts`) and bge-m3 cosine similarity
   (`lib/rag/embeddings.ts`) fused with reciprocal-rank fusion (`lib/rag/retrieve.ts`);
   the chosen jurisdiction's Act outranks the central corpus. Vectors are cached under
   `apps/backend/data/index/`; without the embedding server it falls back to BM25.
3. **Answer** — streamed from the model with the retrieved sections as the only sources,
   cited as `[n]`.
4. **Verify** — sources the answer did not cite are dropped; each cited source gets a
   support check; invented or unsupported citations lower the confidence. Low-confidence
   or uncited answers land in the admin review queue.

`NEXT_PUBLIC_CHAT_MODE=mock` makes the frontend use its canned stream
(`/api/mock/chat`) for UI work without a model.

## Corpus

`apps/backend/corpus/<jurisdiction>/*.md` — one `##` heading per section. Six Acts are
included (1,068 sections); see `apps/backend/corpus/README.md` for provenance and how to
add Acts with `npm run ingest -w apps/backend -- <pdf> <jurisdiction> "<title>"`.
Procedures live in `corpus/procedures/*.json`. Admins can upload Acts from the
Documents page.

## Data

Postgres on Supabase (`lib/db.ts`, postgres.js): users, sessions, conversations, feedback,
review queue, glossary. The backend creates the tables on first start and seeds the demo
admin and the starter glossary. Passwords are scrypt-hashed; sessions are httpOnly cookies.

Setup: create a free project at supabase.com, open Project Settings › Database › Connection
string (URI), pick the Session pooler, and put it in `apps/backend/.env` as `DATABASE_URL`.
Any other Postgres works too (`DB_SSL=0` for a local server without TLS).

## Evaluation

```bash
npm run eval -w apps/backend -- --base http://localhost:4000   # all 152 questions
npm run eval -w apps/backend -- --filter -hi                    # one language
```

Start the backend with `CHAT_RATE_LIMIT=1000` for a full run — the default per-client
limit (30 per 10 minutes) is meant for users, not benchmarks.

`eval/questions.json` holds 9 topics × jurisdictions × 4 languages with expected sections
taken from the ingested Acts. The runner scores retrieval, correct citation, answer
language and verification, and writes `eval/results/<timestamp>.json`.

Latest run on an RTX 3060 Laptop (6 GB) with Qwen3.5-4B Q4_K_M:

| Language | Retrieval | Cited correctly | Right script | Avg time |
|---|---|---|---|---|
| English | 100% | 97% | 100% | ~13 s |
| Hindi | 95% | 89% | 100% | ~19 s |
| Marathi | 89% | 87% | 100% | ~22 s |
| Tamil | 93% | 97% | 100% | ~23 s |

"Cited correctly" means one of the expected sections is among the sources the answer
actually cites. The verification pass flags a further 15–25% of citations as not fully
supporting their sentence; those show as unverified in the UI and land in the review queue.

## Tests and CI

From the root, `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` run
across both workspaces (vitest: corpus parsing, BM25, password hashing, SSE parsing).
`.github/workflows/ci.yml` runs all four, then starts both apps and runs
`apps/frontend/scripts/smoke.mjs` against the frontend with mock answers.

## Deploy

`docker compose up --build` starts the frontend, the backend, a local Postgres, the chat
model (CUDA image) and the embedding model with API keys from `.env` (`LLM_API_KEY`,
`EMBED_API_KEY`). To use Supabase instead of the bundled Postgres, set `DATABASE_URL` in
`.env` and drop the `db` service.
Both app images build from the repository root (`apps/*/Dockerfile`). The backend's
`data/` and `corpus/` are volumes. The frontend bakes `BACKEND_URL` into its `/api`
rewrite at build time (compose passes it as a build arg). Put HTTPS termination (Caddy,
nginx) in front and set `COOKIE_SECURE=1`; the chat route has a per-client rate limit and
a hard timeout, but no global limiter.

## Configuration

`apps/backend/.env.example`: `DATABASE_URL`, port, model URLs and keys, context size, rate
limit, timeout, CORS. `apps/frontend/.env.example`: `BACKEND_URL`, mock mode, or
`NEXT_PUBLIC_API_URL` to let the browser call the backend directly (then set
`CORS_ORIGIN` on the backend).

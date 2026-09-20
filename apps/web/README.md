# Sahakar Sahayak — web

Multilingual (English, Hindi, Marathi, Tamil) assistant for Indian cooperative-society
law. Answers come from a local model, grounded in the text of six Acts, and every answer
cites the sections it relies on.

## Run locally

```bash
npm install
npm run llm        # terminal 1: chat model server (llama.cpp, downloads Qwen3.5-4B on first run)
npm run embed      # terminal 2: embedding server (bge-m3, CPU) — optional but recommended
npm run dev        # terminal 3: http://localhost:3000
```

`npm run llm` / `npm run embed` need llama.cpp (`winget install llama.cpp` on Windows; see
`scripts/*.ps1` for the flags). Sign in with the demo admin `test@gmail.com` / `1234`, or
register a member account.

| Route | What it is |
|---|---|
| `/{locale}` | Landing page |
| `/{locale}/login`, `/register` | Sign in / create account |
| `/{locale}/ask` | The assistant |
| `/{locale}/checklists` | Step-by-step procedures |
| `/{locale}/admin/*` | Documents, glossary, review queue (admin role) |
| `/{locale}/privacy`, `/terms` | Legal pages |

## How an answer is produced

`src/app/api/chat/route.ts`:

1. **Triage** — one grammar-constrained JSON call: language, intent, escalation, and
   English search terms (so a Hindi question still finds English statute text).
2. **Retrieve** — BM25 (`src/lib/rag/search.ts`) and bge-m3 cosine similarity
   (`src/lib/rag/embeddings.ts`) fused with reciprocal-rank fusion
   (`src/lib/rag/retrieve.ts`); the chosen jurisdiction's Act outranks the central corpus.
   Vectors are cached under `data/index/`; without the embedding server it falls back to BM25.
3. **Answer** — streamed from the model with the retrieved sections as the only sources,
   cited as `[n]`.
4. **Verify** — sources the answer did not cite are dropped; each cited source gets a
   support check; invented or unsupported citations lower the confidence. Low-confidence
   or uncited answers land in the admin review queue.

The frontend consumes the same SSE contract (`meta`, `citations`, `token`, `done`,
`error`) as an external FastAPI backend would, so `NEXT_PUBLIC_API_URL` can still point at
one. `NEXT_PUBLIC_CHAT_MODE=mock` uses a canned stream for UI work.

## Corpus

`corpus/<jurisdiction>/*.md` — one `##` heading per section. Six Acts are included
(1,067 sections); see `corpus/README.md` for provenance and how to add Acts with
`npm run ingest <pdf> <jurisdiction> "<title>"`. Procedures live in
`corpus/procedures/*.json`. Admins can upload Acts from the Documents page.

## Data

SQLite at `data/sahayak.db` (`src/lib/db.ts`): users, sessions, conversations, feedback,
review queue, glossary. Passwords are scrypt-hashed; sessions are httpOnly cookies.

## Evaluation

```bash
npm run eval -- --base http://localhost:3000            # all 152 questions
npm run eval -- --filter -hi                             # one language
```

Start the app with `CHAT_RATE_LIMIT=1000` for a full run — the default per-client limit
(30 per 10 minutes) is meant for users, not benchmarks.

`eval/questions.json` holds 9 topics × jurisdictions × 4 languages with expected sections
taken from the ingested Acts. The runner scores retrieval, correct citation, answer
language and verification, and writes `eval/results/<timestamp>.json`.

Latest run on an RTX 3060 Laptop (6 GB) with Qwen3.5-4B Q4_K_M:

| Language | Retrieval | Cited correctly | Right script | Avg time |
|---|---|---|---|---|
| English | 100% | 97% | 100% | ~13 s |
| Hindi | 95% | 89% | 100% | ~19 s |

## Tests and CI

`npm test` (vitest: corpus parsing, BM25, SSE parsing, password hashing), `npm run lint`,
`npm run typecheck`, `npm run build`. `.github/workflows/ci.yml` runs all four on push.

## Deploy

`docker compose up --build` starts the app, the chat model (CUDA image) and the embedding
model with API keys from `.env` (`LLM_API_KEY`, `EMBED_API_KEY`). The app image is a
Next.js standalone build (`NEXT_OUTPUT=standalone npm run build`). Mount `data/` and
`corpus/` as volumes. Put HTTPS termination (Caddy, nginx) in front; the chat route has a
per-client rate limit and a hard timeout, but no global limiter.

## Configuration

See `.env.example`: model URLs and keys, context size, rate limit, timeout, DB path.

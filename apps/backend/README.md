# @sahayak/backend

The API: Hono on Node, SQLite via better-sqlite3, the RAG pipeline over `corpus/`, and the
launchers for the local llama.cpp servers. Routes live in `src/routes/`, the pipeline in
`src/routes/chat.ts` and `src/lib/rag/`. See the root README for the route table.

```bash
npm run dev            # http://127.0.0.1:4000 (tsx watch)
npm run llm            # chat model server on :8080
npm run embed          # embedding server on :8081 (optional; BM25 only without it)
npm run ingest -- corpus/_sources/some-act.pdf <jurisdiction> "<Act title>" --out some-act.md
npm run eval -- --base http://localhost:4000 [--filter -hi]
```

State lives in `data/` (SQLite database, embedding index); both are rebuilt on first
start if missing. Configuration is in `.env.example`.

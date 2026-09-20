# @sahayak/frontend

The Next.js UI. It holds no data and no model code: server components read from the
backend (`src/lib/backend.ts`, `BACKEND_URL`) and the browser reaches the same API through
the `/api/*` rewrite in `next.config.ts`. See the root README for the full picture.

```bash
npm run dev:frontend          # from the repository root, http://localhost:3000
npm run dev                   # same, from this folder
NEXT_PUBLIC_CHAT_MODE=mock    # canned answers from src/app/api/mock/chat, no backend needed for chat
```

`scripts/smoke.mjs [url]` signs in, saves a conversation, streams an answer and fetches every
public page against a running frontend (`--real` uses the live model instead of the mock).

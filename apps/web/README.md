# Sahakar Sahayak — web

Next.js 16 frontend for the multilingual cooperative governance & legal assistance chatbot.

## Run

```bash
npm install
npm run llm        # terminal 1: local model server (llama.cpp, downloads the model on first run)
npm run dev        # terminal 2: http://localhost:3000  (redirects to /en)
```

`npm run llm` needs llama.cpp (`winget install llama.cpp`) and serves
`unsloth/Qwen3.5-4B-GGUF:Q4_K_M` (2.7 GB, fits a 6 GB GPU) on http://127.0.0.1:8080
with an OpenAI-compatible API. Pick another GGUF with `LLM_HF_MODEL`, e.g.
`unsloth/Qwen3.5-9B-GGUF:Q4_K_M` on an 8 GB+ card or `unsloth/gemma-3-4b-it-GGUF:Q4_K_M`.

Answers come from the built-in pipeline in `src/app/api/chat/route.ts`:

1. one small JSON call classifies language, intent and escalation and turns the
   question into English search terms;
2. BM25 (`src/lib/rag/search.ts`) picks the top sections from `./corpus` for the
   chosen jurisdiction (plus `central`);
3. the model answers from those sections only, citing them as `[n]`.

The corpus ships with short excerpts; add the Acts as Markdown, one `##` per
section — see `corpus/README.md`. Set `NEXT_PUBLIC_CHAT_MODE=mock` to use the
canned stream instead, or `NEXT_PUBLIC_API_URL` to talk to an external backend:

```bash
cp .env.example .env.local
```

## Pages and sign-in

| Route | What it is |
|-------|------------|
| `/{locale}` | Landing page |
| `/{locale}/login` | Sign-in |
| `/{locale}/ask` | The assistant (signed in) |
| `/{locale}/checklists`, `/{locale}/admin` | Procedures and admin (signed in) |

Sign-in is a demo: one fixed account, checked in `src/lib/auth.ts`, that sets an
httpOnly session cookie. Replace `verify()` and `getSessionUser()` there when real
accounts arrive.

| Email | Password |
|-------|----------|
| `test@gmail.com` | `1234` |

With no `NEXT_PUBLIC_API_URL` set, the chat talks to the built-in mock stream at
`/api/mock/chat`, so the UI runs without the backend or Ollama. Point it at the
FastAPI service with:

```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Backend contract

`POST {API_URL}/v1/chat` — body `{ session_id, message, language, jurisdiction }`,
response `text/event-stream` with these frames (see `src/lib/types.ts`):

| event       | data                                                                 |
|-------------|----------------------------------------------------------------------|
| `meta`      | `{ intent, confidence, language_detected, escalate }`                |
| `citations` | `[{ id, act, section, title, excerpt, jurisdiction, verified }]`     |
| `token`     | `{ text }` — appended to the answer; `[n]` in text maps to citation `id` |
| `done`      | `{ message_id }`                                                      |
| `error`     | `{ message }`                                                         |

`POST {API_URL}/v1/chat/{message_id}/feedback` — `{ value: "up" | "down", note? }`.

## Layout

```
src/
  app/[locale]/            chat (/) · checklists · admin/{documents,glossary,queries}
  app/api/mock/chat        SSE mock so the UI works standalone
  components/chat/         ChatPanel, Composer, MessageBubble, AnswerText, SourcesLedger, EmptyState
  components/layout/       AppShell, LanguageSwitcher, JurisdictionSelect, JurisdictionProvider
  components/admin/        AdminNav, DataTable
  hooks/                   useChat (streaming state), useSpeech (browser STT)
  lib/                     api (SSE client), config (languages, jurisdictions), types, fonts, mock-data
  i18n/                    next-intl routing
messages/{en,hi,mr,ta}.json   UI strings
```

Languages: English, Hindi, Marathi, Tamil. Add one by appending to `src/i18n/routing.ts`,
`src/lib/config.ts` (`LANGUAGES`, with the speech-recognition tag) and a `messages/<code>.json`.

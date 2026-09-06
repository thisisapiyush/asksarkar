# Ask Sarkar

What papers do I need? Ask before you travel to a government office.

A multilingual RAG helpdesk that answers Nepali citizens' questions about government services — documents to bring, which office, what fee, how long it takes — in English, Nepali (Devanagari), or Nepali (Roman script).

> **Demo data.** All procedure content is placeholder. Not real government procedure — replace before any public use.

## Stack

- **Next.js 15** (App Router, TypeScript) — UI and API in one service
- **Postgres + pgvector** — hybrid search with vector similarity, full-text, and trigram matching
- **Anthropic Claude** — answer generation (Sonnet) and query normalization (Haiku)
- **Transformers.js** — in-process embeddings with multilingual-e5-base (no paid embedding API)
- **Drizzle ORM** — schema, migrations, queries
- **Tailwind CSS v4**

## How it works

1. Citizen asks a question in any of three scripts (English, Devanagari Nepali, Roman Nepali)
2. Query is normalized to canonical English for embedding
3. Hybrid retrieval: pgvector cosine similarity + Postgres full-text search + pg_trgm trigram matching, fused with Reciprocal Rank Fusion
4. Top chunks are passed to Claude with strict grounding — no invented documents, fees, or timelines
5. Answer streams back via SSE in the citizen's chosen language

## Three answer languages

| Mode | Example |
|---|---|
| English | "You need your birth certificate and your father's citizenship copy." |
| नेपाली | "तपाईंलाई जन्म दर्ता प्रमाणपत्र र बुबाको नागरिकताको प्रतिलिपि चाहिन्छ।" |
| Nepali (Roman) | "Tapailai janma darta pramanpatra ra buba ko nagarikta ko pratilipi chahincha." |

## Development

```sh
# Install dependencies
npm install

# Push schema to your Postgres database
npm run db:push

# Seed the 8 placeholder volumes (idempotent)
npm run db:seed

# Re-embed all chunks after model or chunking changes
npm run db:reembed

# Start dev server
npm run dev
```

Requires a Postgres instance with `pgvector` and `pg_trgm` extensions. Set `DATABASE_URL` in `.env.local` — see `.env.example` for all required variables.

## Deployment

Deploys to Railway (Nixpacks, no Dockerfile). See [DEPLOY.md](./DEPLOY.md) for the full setup guide.

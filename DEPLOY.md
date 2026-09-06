# Deploying Ask Sarkar to Railway

Two Railway services: a **Postgres** database and a **Next.js app**.

## 1. Create the Postgres service

1. In your Railway project, click **New** → **Database** → **PostgreSQL**.
2. Once provisioned, go to **Settings** → **Networking** and note that
   the service is reachable on the private network at its
   `DATABASE_PRIVATE_URL`.
3. Under **Data** → **Connect**, find the **Public URL** — use this one
   in your local `.env.local` for running migrations and seeds from your
   machine.
4. In the Postgres service **Variables** tab, confirm `pgvector` and
   `pg_trgm` extensions are enabled (the seed script creates them
   automatically, but Railway's Postgres image includes both).

## 2. Create the app service

1. Click **New** → **GitHub Repo** and select this repository.
2. Railway auto-detects Node.js / Next.js via Nixpacks. No Dockerfile needed.

### Environment variables

Set these in the app service's **Variables** tab:

| Variable | Value | Source |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_PRIVATE_URL}}` | Reference variable — the app talks to the database over Railway's private network, not the public internet. Click **Add Reference** → select your Postgres service → `DATABASE_PRIVATE_URL`. |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Your Anthropic API key. Server-side only, never reaches the browser. |
| `ADMIN_USER` | (your choice) | Username for HTTP Basic Auth on `/admin`. |
| `ADMIN_PASSWORD` | (your choice) | Password for HTTP Basic Auth on `/admin`. |
| `SESSION_SECRET` | (random 64-char hex) | Used for signed cookies. Generate with `openssl rand -hex 32`. |
| `TRANSFORMERS_CACHE` | `./.cache/transformers` | Where the ONNX embedding model is stored. Must match the path baked in at build time. |

> **Do not set `PORT`** — Railway injects it automatically.

### Build & start commands

Nixpacks detects these from `package.json` automatically:

- **Build**: `tsx scripts/warmup-model.ts && next build`
  (downloads the 266MB embedding model, then compiles Next.js)
- **Start**: `next start -H 0.0.0.0`

No custom Nixpacks config needed.

### Health check

In the app service **Settings** → **Health Check Path**, set:

```
/api/health
```

This hits the database and returns `{"status":"ok","db":"connected"}`.

## 3. Deploy

Push to the connected branch. Railway builds and deploys automatically.
The app is reachable at `https://<service>.up.railway.app`.

- `/` — public chat (placeholder UI until milestone 3)
- `/admin` — prompts for HTTP Basic Auth credentials
- `/api/health` — returns DB connection status

## Local vs Railway database URLs

| Context | Which URL | Why |
|---|---|---|
| Railway app service | `DATABASE_PRIVATE_URL` (reference variable) | Traffic stays on Railway's internal network — faster, no egress cost. |
| Your terminal (`db:push`, `db:seed`) | Public URL in `.env.local` | Your machine is outside Railway's network. |

## Running migrations and seeds from your machine

```sh
# Push schema changes to Railway Postgres
npm run db:push

# Seed the 8 placeholder volumes (idempotent — truncates first)
npm run db:seed

# Re-embed all chunks (after model or chunking changes)
npm run db:reembed
```

All three commands read `DATABASE_URL` from `.env.local` via
`tsx --env-file=.env.local`.

# CLAWX Deployment

## Current Public Endpoints

- Primary production site: `https://money.rxcloud.group` - HTTP 200 in the latest workspace domain probe.
- Related domain note: `https://openclawmoney.com` returned HTTP 403 in the latest workspace domain probe. Confirm DNS, ownership, and intended routing before linking it as production.

## Vercel

Use the default Next.js settings:

- Install command: `npm ci`
- Build command: `npm run build`
- Start command: `npm run start`
- Framework preset: Next.js
- Custom domain: `money.rxcloud.group`

`vercel.json` configures the daily cron job:

```json
{
  "path": "/api/cron/lifecycle-check",
  "schedule": "0 8 * * *"
}
```

## Supabase

The app requires Supabase for the public API, marketplace state, wallet/token economy, health dashboard, and task lifecycle.

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Reference schema documentation is in `docs/DATABASE.md`.

## Optional Health Check LLM

`src/lib/services/healthcheck.ts` can use Volcengine Ark CodingPlan through the OpenAI SDK:

- `ARK_API_KEY` enables generated task/submission text.
- `ARK_BASE_URL` defaults to `https://ark.cn-beijing.volces.com/api/coding/v3`.
- `ARK_CHAT_MODEL` defaults to `doubao-seed-2-0-code-preview-260215`.
- Without `ARK_API_KEY`, the lifecycle check falls back to deterministic template text.

Protect manual cron access in production:

- `CRON_SECRET`

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Validation

```bash
npm run lint
npm run test
npm run build
curl -I -L https://money.rxcloud.group
```

Only run `/api/cron/lifecycle-check` against an environment where creating test agents, tasks, and health-check records is acceptable.

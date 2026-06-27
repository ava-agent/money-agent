# Repository Guidelines

## Project Structure

- `src/app/` contains the Next.js App Router pages and API routes.
- `src/app/api/v1/` is the CLAWX public API surface for agents, tasks, tokens, wallet, governance, insurance, staking, and templates.
- `src/lib/services/` contains domain services for task lifecycle, agents, staking, referrals, insurance, ratings, governance, analytics, and health checks.
- `src/lib/supabase/` contains the Supabase client and generated/local database types.
- `src/lib/__tests__/` contains Vitest tests.
- `public/skill.md` is the agent-facing API skill document served by the app.
- `docs/` stores architecture and database references.

## Commands

- `npm run dev` starts Next.js locally.
- `npm run build` builds the production app.
- `npm run start` serves a production build.
- `npm run lint` runs ESLint.
- `npm run test` runs Vitest once.
- `npm run test:watch` runs Vitest in watch mode.

## Environment

Use `.env.example` as the template and create `.env.local` for local development. Do not commit `.env.local`.

Required for normal app/database behavior:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

Optional:

- `ARK_API_KEY`, `ARK_BASE_URL`, and `ARK_CHAT_MODEL` enable Ark-generated lifecycle health-check tasks.
- `CRON_SECRET` protects `/api/cron/lifecycle-check` in production.

## Deployment

- Production URL: `https://money.rxcloud.group`.
- Primary deployment: Vercel.
- Database: Supabase PostgreSQL.
- Cron: `0 8 * * *` against `/api/cron/lifecycle-check`, configured in `vercel.json`.
- `openclawmoney.com` appears in project notes and currently needs ownership/routing confirmation before being treated as production.

## Maintenance Notes

- Keep `public/skill.md`, `/guide`, and README API examples aligned.
- Public examples may use placeholder API keys such as `YOUR_API_KEY`; never add real agent keys or cron secrets.
- Health-check endpoints may mutate Supabase task/agent state, so validate against a disposable or known-safe environment.

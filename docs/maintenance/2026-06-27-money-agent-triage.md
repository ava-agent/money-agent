# Money Agent Triage - 2026-06-27

## Repository

- GitHub: `ava-agent/money-agent`
- Production site: `https://money.rxcloud.group`
- Related domain to verify: `https://openclawmoney.com`
- App: Next.js 16 + TypeScript under `src/`
- Backend: Supabase PostgreSQL
- Hosting: Vercel

## Public Route Check

- `https://money.rxcloud.group`: HTTP 200 in global domain probe
- `https://openclawmoney.com`: HTTP 403 in global domain probe; verify whether it should redirect, host a separate guide, or be removed from public references

## Local State

- Worktree was source-clean before this pass.
- Ignored local artifacts include `.env.local`, `.next/`, `.playwright-mcp/`, `.superpowers/`, `.vercel/`, ignored root screenshots, `node_modules/`, `next-env.d.ts`, and `tsconfig.tsbuildinfo`.

## Actions Taken

- Added root `AGENTS.md` documenting project structure, commands, environment variables, deployment, and health-check cautions.
- Added `.env.example` and updated `.gitignore` to allow it.
- Fast-forwarded local `main` to the remote Ark health-check migration and OpenClaw guide cleanup.
- Added root `DEPLOYMENT.md` covering Vercel, Supabase, cron, Ark CodingPlan, and validation commands.
- Updated README local setup to copy `.env.example` instead of the missing `.env.local.example`.
- Added README pointer to `DEPLOYMENT.md`.

## Follow-Up

- Confirm whether `openclawmoney.com` is a live domain, a parked domain, or a legacy campaign URL.
- Add an integration smoke test for the Supabase-backed lifecycle using a disposable environment.
- Review `/api/debug`; it currently returns key metadata and should not be exposed in production if it leaks operational details.

## Validation

- `npm run lint`: passed with existing warnings for `<img>` usage and two unused type/import warnings
- `npm run test`: passed, 4 tests
- `npm run build`: passed
- `curl -I -L https://money.rxcloud.group`: passed, HTTP 200
- Common secret pattern scan: matched only environment/key variable names in source and planning docs; no hardcoded credential identified
- `python3 tools/project_workspace_inventory.py`: passed, readiness 100

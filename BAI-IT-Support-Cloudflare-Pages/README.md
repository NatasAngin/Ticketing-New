# BAI IT Support — Cloudflare Workers + D1

## Target deployment

- Repository: `NatasAngin/Ticketing-New`
- Branch: `main`
- Live URL: https://bai-it-support.sumarewbarbosa.workers.dev/
- Deployment: GitHub Actions → Cloudflare Workers
- Static application files: `public/`
- Worker entry point: `src/worker.js`
- D1 database: `bai-it-support-kpi-db`
- D1 binding: `DB`
- Migration directory: `migrations/`

## One-time GitHub configuration

Open **GitHub → Settings → Secrets and variables → Actions → New repository secret** and add:

1. `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Account-level **Workers Scripts: Edit** and **D1: Edit** permissions for the account that owns the Worker.
2. `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID.

Do not put either value in source files, commits, or chat messages.

## Automatic deployment

Every push to `main` that changes `BAI-IT-Support-Cloudflare-Pages/**` or the deployment workflow starts **Deploy BAI IT Support to Cloudflare Workers**.

The workflow:
1. Validates the current frontend and Worker JavaScript.
2. Validates the SQL migration in a temporary SQLite database.
3. Finds the D1 database `bai-it-support-kpi-db`; creates it if it does not exist.
4. Generates a deployment config with the real D1 database ID (the ID is not committed).
5. Applies pending D1 migrations remotely.
6. Deploys the Worker and the `public/` static assets.
7. Calls `/api/health` and requires both Worker and D1 checks to pass.

If a step fails, open **GitHub → Actions → Deploy BAI IT Support to Cloudflare Workers**, select the failed run, and expand the failed step. The workflow uses explicit error messages so missing secrets, D1 provisioning, migration, deploy, and health-check failures can be distinguished.

You can also start a run manually from the Actions tab using **Run workflow**.

## Health endpoint

Open:

https://bai-it-support.sumarewbarbosa.workers.dev/api/health

A healthy response reports `ok: true`, `worker: true`, and `database: true`. A failed D1 query returns HTTP 503 and a diagnostic message.

## Current D1 migration scope

The first migration creates the central tables for users, tickets, hold periods, comments, attachment metadata, ticket events, application settings, and audit logs.

**Important:** this establishes the database and a health-check endpoint. The existing browser application still uses localStorage/IndexedDB for its operational data. Its login, ticket CRUD, discussions, and attachment flows have not yet been migrated to authenticated Worker API endpoints. Do not treat the D1 schema alone as proof that existing browser data is synchronized or centrally secured. That application migration is the next development phase. Attachment file bytes will require a separate object-storage decision (for example, R2); D1 stores metadata only.

## Deployment configuration

- `wrangler.worker.jsonc` is the Worker + static assets + D1 configuration template.
- The workflow writes the real D1 ID into a temporary generated config at runtime.
- The existing `wrangler.toml` is retained for reference to the previous Pages setup; production GitHub Actions uses `wrangler.worker.jsonc`.

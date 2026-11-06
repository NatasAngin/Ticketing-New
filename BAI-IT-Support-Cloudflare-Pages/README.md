# BAI IT Support — Cloudflare Workers + D1

## Architecture

- GitHub repository: `NatasAngin/Ticketing-New`
- Branch: `main`
- Worker name: `bai-it-support`
- Target URL: https://bai-it-support.sumarewbarbosa.workers.dev/
- Worker entry point: `src/worker.js`
- Static assets: `public/`
- D1 database name: `bai-it-support-kpi-db`
- D1 binding: `DB`
- SQL migrations: `migrations/`

This application needs a Cloudflare Worker and a D1 database. Deploying only the `public/` folder as a Pages static site will not provide the login, ticket API, or shared database.

## Deployment without GitHub Secrets

The repository no longer attempts to authenticate to Cloudflare from GitHub Actions. GitHub Actions only validates JavaScript and SQL migrations. Use Cloudflare's Git integration (Workers Builds), which connects your GitHub repository to your Cloudflare account without putting a Cloudflare API token in GitHub repository secrets.

### 1. Create the D1 database

1. Sign in to the Cloudflare dashboard.
2. Open **Storage & databases → D1 SQL Database**.
3. Create a database named `bai-it-support-kpi-db`.
4. Open the new database and copy its **Database ID**.

### 2. Set the D1 ID in the repository

1. Open `BAI-IT-Support-Cloudflare-Pages/wrangler.worker.jsonc` on the `main` branch.
2. Replace `__D1_DATABASE_ID__` with the Database ID copied from Cloudflare.
3. Commit the change.

The ID is an identifier, not an API token. Never commit an API token or other credential.

### 3. Connect Cloudflare Workers Builds to GitHub

1. In Cloudflare dashboard, open **Workers & Pages** and choose **Create application** / **Create Worker**.
2. Choose the GitHub repository option and connect `NatasAngin/Ticketing-New`.
3. Select branch `main`.
4. Set the repository root / working directory to `BAI-IT-Support-Cloudflare-Pages`.
5. Set the build/deploy command to:
   `npx wrangler deploy --config wrangler.worker.jsonc`
6. If the setup asks for a build command, use:
   `npm install`
7. Confirm the Worker name is `bai-it-support`, then deploy.

Cloudflare's Git integration manages deployment authorization from your Cloudflare account. Do not add `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID` to GitHub Secrets for this setup.

### 4. Apply D1 migrations

After the Worker is connected to the D1 database, apply the SQL migrations once from a terminal authenticated to your Cloudflare account, with the project directory as the working directory:

```bash
npx wrangler d1 migrations apply bai-it-support-kpi-db --remote --config wrangler.worker.jsonc
```

This step uses your own Cloudflare login via Wrangler, not a GitHub secret. Review the migration files before applying them.

### 5. Verify

Open:

- App: https://bai-it-support.sumarewbarbosa.workers.dev/
- Health check: https://bai-it-support.sumarewbarbosa.workers.dev/api/health

A healthy response should include `"ok": true`, `"worker": true`, and `"database": true`.

## GitHub Actions

The workflow at `.github/workflows/deploy-cloudflare.yml` is now validation-only. It checks frontend/Worker JavaScript and the D1 migration SQL. It does not deploy and does not require repository secrets.

## Important application status

The Worker contains the authenticated API and the D1 schema. The health endpoint verifies that the Worker can query the expected D1 tables. Do not assume existing browser-local data has been synchronized into D1 unless the app's API migration and data flows have been tested end to end.

Attachments currently store metadata in D1. This setup does not use Cloudflare R2.

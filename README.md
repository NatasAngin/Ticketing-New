# BAI IT Support & KPI Dashboard

Production deployment is now managed through **GitHub Actions → Cloudflare Workers + D1**.

- Live application: https://bai-it-support-kpi.sumarewbarbosa.workers.dev/
- Source project: [BAI-IT-Support-Cloudflare-Pages](./BAI-IT-Support-Cloudflare-Pages/)
- Deployment workflow: [Deploy BAI IT Support to Cloudflare Workers](./.github/workflows/deploy-cloudflare.yml)
- Setup and troubleshooting: [Project deployment README](./BAI-IT-Support-Cloudflare-Pages/README.md)

Every push to `main` that changes the application or deployment workflow triggers validation, D1 provisioning (if needed), migrations, Worker deployment, and a live health check.

Required repository Actions secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The first D1 migration creates the central schema. Existing application data is still browser-local until the frontend's authentication, ticket, discussion, and attachment operations are migrated to Worker API endpoints.

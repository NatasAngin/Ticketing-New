# BAI IT Support & KPI Dashboard

Aplikasi helpdesk internal PT Borneo Alumina Indonesia.

- **Worker:** `bai-it-support`
- **Aplikasi:** https://bai-it-support.sumarewbarbosa.workers.dev/
- **Health check:** https://bai-it-support.sumarewbarbosa.workers.dev/api/health
- **Source:** [BAI-IT-Support-Cloudflare-Pages](./BAI-IT-Support-Cloudflare-Pages/)
- **Deployment:** [GitHub Actions workflow](./.github/workflows/deploy-cloudflare.yml)

## Deployment

Setiap perubahan pada `main` di folder aplikasi atau workflow akan menjalankan validasi, menerapkan migrasi D1, deploy Worker beserta static assets, lalu menguji endpoint health dan halaman utama.

GitHub Actions memerlukan dua repository Actions secrets yang dibuat dari akun Cloudflare pemilik Worker:

- `CLOUDFLARE_API_TOKEN` — token dengan izin Account Workers Scripts Edit dan D1 Edit.
- `CLOUDFLARE_ACCOUNT_ID` — Account ID Cloudflare.

Tambahkan keduanya di **Settings → Secrets and variables → Actions**. Jangan commit token ke repository atau membagikannya melalui chat. Setelah secrets tersedia, jalankan ulang job yang gagal pada tab Actions.

## Infrastruktur

- Worker: `bai-it-support`
- D1 database: `bai-it-support-kpi-db`
- D1 binding: `DB`
- Assets binding: `ASSETS`
- Database migrations: `BAI-IT-Support-Cloudflare-Pages/migrations/`

Status deployment hanya dianggap berhasil jika GitHub Actions selesai sukses, endpoint `/api/health` menyatakan database dan schema siap, serta halaman utama memuat aplikasi (bukan halaman Hello World).

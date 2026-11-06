# BAI IT Support — Cloudflare Workers + D1

## Arsitektur

- Repository: `NatasAngin/Ticketing-New`
- Branch deployment: `main`
- Worker: `bai-it-support`
- URL: https://bai-it-support.sumarewbarbosa.workers.dev/
- Entry point: `src/worker.js`
- Static assets: `public/`
- Assets binding: `ASSETS`
- D1 database: `bai-it-support-kpi-db`
- D1 binding: `DB`
- Migrations: `migrations/`

Aplikasi membutuhkan Cloudflare Worker dan D1. Deploy folder `public/` sebagai situs statis saja tidak cukup untuk login, API tiket, dan database bersama.

## Deployment otomatis melalui GitHub Actions

Workflow `../.github/workflows/deploy-cloudflare.yml` menjalankan validasi JavaScript dan migrasi SQL, menerapkan migrasi D1, deploy Worker beserta static assets, lalu memverifikasi API dan halaman utama.

Diperlukan dua GitHub Actions repository secrets:

1. `CLOUDFLARE_API_TOKEN`
2. `CLOUDFLARE_ACCOUNT_ID`

Buat API Token di Cloudflare Dashboard → My Profile → API Tokens. Berikan izin minimum:
- Account → Workers Scripts → Edit
- Account → D1 → Edit

Tambahkan token dan Account ID melalui GitHub repository → Settings → Secrets and variables → Actions. Jangan menaruh token di source code, file konfigurasi, commit, atau chat.

Setelah secrets tersedia, buka tab **Actions**, pilih workflow **Validate and deploy BAI IT Support**, lalu gunakan **Re-run jobs** pada run terakhir yang gagal. Push berikutnya pada folder aplikasi atau workflow juga akan memicu pipeline.

## Database dan migrasi

Konfigurasi D1 ada di `wrangler.worker.jsonc`; binding `DB` digunakan oleh Worker melalui `env.DB`. Nama database yang dikonfigurasi adalah `bai-it-support-kpi-db`. Migrasi dijalankan otomatis oleh workflow sebelum deployment.

## Verifikasi deployment

- Aplikasi: https://bai-it-support.sumarewbarbosa.workers.dev/
- Health: https://bai-it-support.sumarewbarbosa.workers.dev/api/health

Deployment dinyatakan siap hanya jika GitHub Actions sukses, health check menunjukkan `ok`, `worker`, `database`, dan `schema_ready` bernilai true, serta halaman utama menampilkan aplikasi.

## Catatan operasional

Worker menyediakan API autentikasi, akun, tiket, diskusi, dan lampiran. Fitur harus tetap diuji end-to-end setelah deployment; validasi sintaks dan migrasi SQL saja tidak membuktikan seluruh alur bisnis telah berjalan.

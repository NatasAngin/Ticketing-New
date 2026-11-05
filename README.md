# BAI IT Support & KPI Dashboard

Aplikasi statis untuk Cloudflare Pages. Tidak menggunakan Cloudflare R2.

## Deploy dari GitHub ke Cloudflare Pages

Repository: `NatasAngin/Ticketing-New`  
Branch: `main`  
Root directory (advanced): `BAI-IT-Support-Cloudflare-Pages`  
Framework preset: `None`  
Build command: kosongkan  
Build output directory: `public`

Jangan gunakan `npx wrangler deploy`: itu perintah untuk Cloudflare Workers dan menyebabkan error deteksi static assets pada project Pages ini.

Jika melakukan deploy manual melalui terminal dari folder `BAI-IT-Support-Cloudflare-Pages`:

```bash
npm install
npx wrangler login
npm run deploy
```

Script deploy yang tersedia menjalankan:

```bash
wrangler pages deploy public --project-name bai-it-support-kpi
```

## Catatan penyimpanan

Aplikasi ini saat ini menyimpan akun, tiket, dan pengaturan di browser (localStorage/IndexedDB). Data tidak tersinkron antar-PC atau antar-browser. Cloudflare Pages hanya meng-host file statis. Jangan menghapus data browser sebelum melakukan backup/ekspor yang tersedia.

Tidak ada konfigurasi atau kebutuhan R2.

# BAI IT Support — Cloudflare Pages

## Isi dan status
Project ini menggunakan versi browser dari aplikasi sumber (HTML, CSS, JavaScript).
Tidak memerlukan PHP, XAMPP, Node.js runtime, atau database untuk ditampilkan.

**Penting tentang data:** akun, tiket, pengaturan, dan kategori tersimpan pada `localStorage` browser. Diskusi dan lampiran tersimpan pada `IndexedDB` browser. Cloudflare Pages hanya meng-host file aplikasi; ia tidak membuat data menjadi bersama antar-PC/browser. Gunakan browser dan profil yang sama untuk mengakses data yang sama. Jangan menghapus data situs/browser sebelum melakukan ekspor/backup yang tersedia.

## Deploy melalui GitHub → Cloudflare Pages
1. Buat repository GitHub baru, misalnya `bai-it-support-kpi`.
2. Upload seluruh isi folder project ini ke root repository (folder `public` harus berada di root).
3. Di Cloudflare Dashboard buka **Workers & Pages → Create → Pages → Connect to Git**.
4. Pilih repository tersebut.
5. Framework preset: **None**.
6. Build command: kosongkan (atau `exit 0` jika form mewajibkan perintah).
7. Build output directory: `public`.
8. Klik **Save and Deploy**.

## Deploy via Wrangler (opsional)
Prasyarat: Node.js LTS dan akun Cloudflare yang sudah login.

```bash
npm install
npx wrangler login
npm run deploy
```

Perintah deploy membuat/menyebarkan project Pages bernama `bai-it-support-kpi`.

## Menjalankan lokal
```bash
npm install
npm run dev
```

## Batasan yang belum dimigrasikan
- Belum ada API/backend dan database terpusat.
- Login/role saat ini dikelola oleh kode browser, bukan otorisasi server. Jangan gunakan ini sebagai kontrol keamanan untuk data sensitif atau akses publik.
- Diskusi, notifikasi baca, dan lampiran tidak tersinkron antar perangkat.
- Untuk multi-user sungguhan diperlukan migrasi terpisah ke Cloudflare Workers + D1 (akun/sesi/tiket) dan R2 (lampiran), termasuk pemindahan autentikasi dan validasi hak akses ke server. Jangan sekadar menambahkan D1 tanpa mengubah kode frontend dan aturan akses.

## Struktur
- `public/` — file statis aplikasi yang disajikan Cloudflare Pages
- `wrangler.toml` — konfigurasi Wrangler Pages
- `package.json` — perintah dev/deploy

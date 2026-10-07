# Menyiapkan publikasi artikel untuk semua pengunjung

Dashboard GitHub Pages bersifat statis dan tidak dapat menyimpan artikel langsung ke server. Worker ini menerima artikel dari dashboard, lalu menggunakan GitHub API untuk memperbarui `articles.json` pada repository. Token GitHub hanya disimpan sebagai secret di Cloudflare Worker.

## Sebelum memasang Worker

Pastikan perubahan website dari folder ini sudah dikirim ke repository GitHub pada branch `master`. GitHub Pages harus menerbitkan branch tersebut dari root repository agar `articles.json`, halaman Blog, dan script publik terbaru tersedia bagi pengunjung. Perubahan yang hanya ada di komputer lokal belum dapat dilihat pengunjung.

## 1. Buat token GitHub khusus Worker

Di GitHub buka **Settings → Developer settings → Fine-grained personal access tokens → Generate new token**:

- Pilih hanya repository `Esma-Blog`.
- Berikan **Contents: Read and write**.
- Atur masa berlaku token.
- Salin token saat dibuat; jangan masukkan token ini ke source code atau dashboard.

## 2. Pasang dan deploy Cloudflare Worker

Pasang Node.js LTS, lalu buka PowerShell pada folder `worker`:

```powershell
npx wrangler login
npx wrangler deploy
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put PUBLISH_TOKEN
```

Saat diminta:

- `GITHUB_TOKEN`: tempel fine-grained token dari langkah 1.
- `PUBLISH_TOKEN`: buat nilai acak panjang. Contoh pembuatan 32-byte acak di PowerShell:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Simpan nilai `PUBLISH_TOKEN` untuk dimasukkan ke pengaturan dashboard. Jangan bagikan atau commit nilai tersebut.

Deploy menghasilkan URL Worker `https://esma-blog-publisher.esma-blog.workers.dev`. URL tersebut sudah menjadi nilai bawaan pada **Pengaturan publikasi untuk semua pengunjung** di dashboard. Masukkan `PUBLISH_TOKEN` di sana; URL dan token hanya disimpan pada sesi tab dashboard.

Jika situs menggunakan custom domain atau server lokal dengan port berbeda dari `8000`, perbarui `ALLOWED_ORIGINS` di `wrangler.toml` ke origin yang tepat (scheme + host + port, tanpa path), lalu deploy ulang Worker.

## 3. Publish

Pastikan GitHub Pages aktif untuk repository dan branch `master`. Saat menekan **Simpan artikel**, Worker akan membuat commit yang memperbarui `articles.json`. Setelah GitHub Pages selesai deploy commit tersebut, artikel dapat dilihat publik di beranda dan halaman Blog.

Kegagalan koneksi, autentikasi, izin GitHub, atau commit akan ditampilkan pada dashboard; artikel tidak akan ditandai berhasil dipublikasikan.

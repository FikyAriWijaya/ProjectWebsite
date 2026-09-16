# Millennial Qurban — Panduan Deploy ke Vercel

Project ini pakai **Vercel KV** (database key-value bawaan Vercel, berbasis Redis)
sebagai pengganti `window.storage`. Kode JavaScript di `index.html` **tidak diubah
logikanya** — hanya ditambah "shim" kecil yang membuat `window.storage` memanggil
API serverless di folder `api/`.

## Struktur Project

```
vercel-deploy/
├── index.html              → Website (statis, otomatis di-serve oleh Vercel)
├── package.json             → Dependency (@vercel/kv)
└── api/
    ├── storage.js            → Handle: simpan data (POST) & daftar key (GET list)
    └── storage/
        └── [key].js           → Handle: ambil satu data (GET) & hapus (DELETE)
```

## Cara Deploy

### 1. Upload ke GitHub
Upload folder `vercel-deploy` ini ke repository GitHub baru.

### 2. Import ke Vercel
1. Buka [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Pilih repository GitHub yang baru kamu buat.
3. Vercel otomatis mendeteksi ini sebagai project Node.js — biarkan pengaturan default, klik **Deploy**.

### 3. Aktifkan Vercel KV (WAJIB, ini pengganti database-nya)
1. Setelah project ter-deploy, buka dashboard project-nya di Vercel.
2. Klik tab **"Storage"** → **"Create Database"** → pilih **"KV"**.
3. Ikuti langkah pembuatan (kasih nama bebas, pilih region terdekat).
4. Setelah dibuat, klik **"Connect Project"** → pilih project kamu → Vercel otomatis
   menambahkan environment variable yang dibutuhkan (`KV_REST_API_URL`,
   `KV_REST_API_TOKEN`, dst) ke project kamu.
5. **Redeploy** project kamu sekali lagi (tab Deployments → titik tiga → Redeploy)
   supaya environment variable barunya terbaca.

### 4. Selesai
Buka URL project Vercel kamu (mis. `https://nama-project-mu.vercel.app`) — website
akan tampil dan semua fitur admin (booking, katalog, notifikasi) langsung
berfungsi, datanya tersimpan sungguhan di Vercel KV.

## Cara Kerja Teknisnya

```
Sebelumnya (di Claude):
  Browser → window.storage (bawaan Claude) → server Claude

Sekarang (di Vercel):
  Browser → window.storage (shim) → fetch ke /api/storage/...
          → serverless function (api/storage.js, api/storage/[key].js)
          → Vercel KV (Redis)
```

Setiap key disimpan dengan prefix `shared:` atau `private:` tergantung parameter
`shared` yang dikirim — ini meniru pembedaan data "untuk semua pengunjung" vs
"personal per-browser" yang sudah ada di aplikasi aslinya (mis. status baca
notifikasi bersifat personal, sedangkan data booking bersifat shared).

## Kenapa Tidak Pakai SQLite Seperti Versi Railway?

Vercel menjalankan kode sebagai *serverless function* — setiap request bisa
dijalankan di instance/container yang berbeda-beda, **tidak ada disk permanen**
yang bisa diandalkan seperti server tradisional (Railway). Kalau tetap memaksa
pakai file SQLite lokal di Vercel, datanya bisa hilang atau tidak konsisten
kapan saja. Vercel KV dirancang khusus untuk kasus seperti ini — cepat, dan
memang ditujukan untuk dipakai dari serverless function.

## Batasan Free Tier Vercel KV

Paket gratis Vercel KV punya batas jumlah command per bulan (biasanya cukup
untuk penggunaan kecil-menengah, ratusan hingga ribuan pengunjung). Kalau
nanti website ini ramai, cek dashboard Vercel untuk melihat pemakaian, dan
pertimbangkan upgrade paket kalau sudah mendekati batas.

## Yang Masih Perlu Ditingkatkan untuk Produksi Sungguhan

Sama seperti versi Railway, hal berikut sebaiknya diperbaiki sebelum dipakai
serius menerima data pelanggan & uang sungguhan:

- **Password admin** masih tersimpan sebagai teks biasa — sebaiknya di-hash
  pakai `bcrypt` dan pindahkan proses cek login ke server (bukan di JavaScript
  browser) supaya tidak bisa dilihat/dilewati dari sisi klien.
- **Validasi form** (nomor HP, dll) saat ini hanya jalan di browser — sebaiknya
  divalidasi ulang di serverless function juga.
- Kalau butuh query data yang lebih kompleks nantinya (laporan, filter rumit),
  pertimbangkan migrasi ke database relasional seperti **Vercel Postgres** atau
  **Supabase**, karena Vercel KV paling cocok untuk penyimpanan key-value
  sederhana seperti sekarang, bukan query kompleks.

Kalau butuh bantuan implementasi salah satu poin di atas, tinggal minta ya.

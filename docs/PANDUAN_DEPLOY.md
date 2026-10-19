# Panduan deploy: Railway (backend) dan Vercel (front end)

Menu dan nama tombol di Railway, Vercel, dan Meta dapat berubah. Bila berbeda, ikuti dokumentasi resmi mereka dan
cocokkan dengan maksud langkah di bawah. Hal yang belum pernah saya jalankan sendiri ditandai **(belum teruji)**.

## 0. Susunan repo

```
maternalguard/
├── frontend/   <- Next.js
├── backend/    <- FastAPI + worker
├── docs/
└── README.md
```
Kerjakan di branch (misalnya `monorepo`), jangan langsung di `main`, karena Vercel mungkin sudah deploy otomatis dari `main`.

## 0b. Bila `main` hanya berisi front end (struktur lama) dan `monorepo` berisi semuanya

- Selama `main` belum digabung dengan `monorepo`, biarkan Vercel membangun `main` dengan **Root Directory kosong**
  (file Next.js ada di akar). Isi `API_MODE=mock` atau kosongkan: situs Vercel menampilkan antarmuka dengan data
  tiruan, karena backend asli hanya berjalan di laptop (lihat `PANDUAN_LOKAL_WINDOWS.md`).
- Agar Vercel tidak membangun branch `monorepo` (yang tidak punya `package.json` di akar dan akan gagal), isi
  **Settings, Git, Ignored Build Step** dengan:
  `if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then exit 1; else exit 0; fi`
  Kode keluar 0 berarti *lewati build*, kode 1 berarti *bangun*. Cek kembali dengan dokumentasi Vercel bila menunya berubah.
- Setelah `monorepo` digabung ke `main`, ubah **Root Directory** menjadi `frontend`, lalu hapus Ignored Build Step di atas.

## 1. Railway: database dan dua layanan

Satu *project* Railway berisi tiga bagian: **Postgres**, **api**, dan **worker**.

1. Buat project, pilih deploy dari repo GitHub Anda.
2. Tambah database: **+ New, Database, PostgreSQL**.
3. **Layanan `api`** (dari repo yang sama):
   - **Settings, Source, Root Directory**: `/backend`.
   - **Settings, Config as Code** (Config File Path): `/backend/railway.toml`. Path ini harus lengkap karena file
     konfigurasi tidak mengikuti Root Directory.
   - **Settings, Networking**: *Generate Domain* (hanya `api` yang diberi domain publik).
   - **Watch Paths**: `/backend/**` agar perubahan front end tidak memicu build backend.
   - Variabel (tab Variables):

     | Nama | Nilai |
     |---|---|
     | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referensi ke layanan database; pastikan nama layanannya sama) |
     | `JWT_SECRET` | acak minimal 32 karakter: `python -c "import secrets;print(secrets.token_urlsafe(48))"` |
     | `ENVIRONMENT` | `production` |
     | `ALLOWED_ORIGINS` | domain Vercel Anda, mis. `https://maternalguard.vercel.app` |
     | `ENABLE_DOCS` | `false` bila tidak ingin `/docs` terbuka |
     | `WHATSAPP_PROVIDER` | `fake` dulu; `cloud` setelah bagian 4 |

   - Saat deploy, `preDeployCommand` menjalankan `alembic upgrade head` lalu `python -m app.seed` (keduanya aman
     diulang), kemudian API dijalankan dan Railway memeriksa `/api/v1/health`.
4. **Layanan `worker`** (tambah layanan kedua dari repo yang sama):
   - Root Directory `/backend`, Config File Path `/backend/railway.worker.toml`.
   - **Tanpa domain publik.** Jumlah replika **1**.
   - Variabel: salin `DATABASE_URL`, `JWT_SECRET`, `ENVIRONMENT`, `WHATSAPP_PROVIDER`, dan semua variabel `WA_*`
     yang sama dengan `api` (Railway mendukung referensi antarlayanan, atau gunakan *Shared Variables*).
5. Periksa: buka `https://<domain-api>/api/v1/health`, hasilnya `{"status":"ok","database":"ok"}`. Log layanan
   `worker` harus memuat "Worker penjadwal berjalan".

Catatan variabel database: dokumentasi Railway lama dan baru berbeda tentang apakah `DATABASE_URL` mengarah ke alamat
publik atau privat. Lihat tab Variables pada layanan Postgres Anda dan pilih alamat internal bila tersedia.
Aplikasi menerima awalan `postgres://` maupun `postgresql://`.

## 2. Vercel: front end

1. Import repo, lalu **Settings, General, Root Directory**: `frontend`.
2. **Settings, Environment Variables**:

   | Nama | Nilai |
   |---|---|
   | `API_MODE` | `live` |
   | `API_BASE_URL` | `https://<domain-api-railway>` (tanpa `/api/v1` di akhir dan tanpa garis miring akhir) |
   | `REGISTRATION_ENABLED` | `true` atau `false` (menyembunyikan halaman dan tombol Daftar) |

3. **Redeploy**: perubahan variabel hanya berlaku pada deploy baru.
4. Front end memanggil backend dari **server Next.js**, bukan dari browser, jadi CORS tidak terlibat. JWT disimpan
   di cookie httpOnly pada domain Vercel.

Jangan memakai `API_MODE=mock` untuk data pasien sungguhan: data mock hanya di memori dan bisa berbeda antar
permintaan di hosting serverless.

## 3. Akun bidan pertama dan uji sambungan

1. Buka situs Vercel, **Daftar**, lalu **Masuk**.
2. Tambah ibu hamil (centang persetujuan WhatsApp), lalu catat pemeriksaan 150/98. Hasilnya high risk dan status
   pesan muncul. Dengan `WHATSAPP_PROVIDER=fake` pesan tidak keluar ke mana pun; status di tab Notifikasi berubah
   sendiri menjadi Terkirim lalu Diterima.
3. Bila Daftar sengaja dimatikan, buat akun lewat shell layanan `api`
   (`python -m app.cli buat-bidan --nama ... --email ... --no-hp ...`) menggunakan Railway CLI atau fitur shell
   Railway **(belum teruji)**.

## 4. WhatsApp Cloud API (belum teruji, butuh akun Meta)

1. Buat aplikasi di Meta for Developers, tambahkan produk WhatsApp, dan siapkan nomor pengirim. Catat
   **Phone Number ID** dan buat **access token** (disarankan token sistem permanen, bukan token uji 24 jam).
2. Daftarkan **template** di WhatsApp Manager untuk setiap tema: pembuka, kontrol, istirahat dan pola hidup,
   kenali tanda, tanya kabar. Kategori dan aturan penulisan template ditentukan Meta dan dapat berubah.
   - Variabel memakai `{{1}}`, `{{2}}`, `{{3}}` berurutan menurut kemunculan **pertama** placeholder pada
     `isi_template` di `backend/app/seed.py`: `{nama}`, `{bidan}`, `{no_hp_bidan}`. Template "istirahat dan pola hidup"
     hanya memakai dua variabel (nama, bidan); yang lain tiga.
   - Jumlah variabel di Meta harus **sama persis** dengan jumlah yang dikirim, atau pengiriman ditolak. Bila Meta
     menolak variabel yang muncul dua kali (mis. `{bidan}` di kalimat penutup), ubah kalimat template agar tiap
     variabel muncul sekali, lalu samakan isinya di tabel `template_pesan`.
   - Isi template harus ditinjau bidan atau tenaga medis.
3. Setelah template disetujui, isi nama template di database:
   `python -m app.cli atur-template --jenis kontrol --nama <nama_template_di_meta>` (ulangi untuk tiap tema;
   lihat daftar dengan `python -m app.cli daftar-template`).
4. Variabel di **api dan worker**: `WHATSAPP_PROVIDER=cloud`, `WA_ACCESS_TOKEN`, `WA_PHONE_NUMBER_ID`,
   `WA_APP_SECRET` (App Secret aplikasi Meta, untuk memverifikasi webhook), `WA_VERIFY_TOKEN` (teks bebas yang Anda
   tentukan), `WA_API_VERSION`, `WA_TEMPLATE_LANGUAGE` (kode bahasa template, mis. `id`).
5. Webhook di konsol Meta: **Callback URL** `https://<domain-api-railway>/api/v1/webhook/whatsapp`, **Verify Token**
   sama dengan `WA_VERIFY_TOKEN`, lalu berlangganan bidang **messages** (status pengiriman).
6. Uji dengan satu nomor Anda sendiri sebelum dipakai untuk ibu hamil. Ibu hamil harus memberi persetujuan
   (opt-in) dan setiap pesan memuat cara berhenti menerima pesan.
7. Meta menetapkan biaya per percakapan atau pesan. Cek halaman harga Meta yang berlaku.

## 5. Daftar periksa sebelum dipakai nyata

- [ ] `JWT_SECRET` acak panjang, bukan nilai contoh.
- [ ] `API_MODE=live` di Vercel, `ENABLE_DOCS=false` di Railway bila tidak diperlukan.
- [ ] Teks template, ambang proteinuria, dan hari/jam kirim sudah disetujui pihak medis.
- [ ] Satu replika worker, dan satu instance API (pembatas login berada di memori).
- [ ] Cadangan (backup) database aktif sesuai fitur Railway pada paket Anda.
- [ ] Kebijakan privasi dan persetujuan ibu hamil sesuai ketentuan data kesehatan yang berlaku.

# MaternalGuard Backend (v2.0)

API FastAPI untuk pencatatan pemeriksaan ibu hamil, skoring risiko preeklamsia, dan notifikasi WhatsApp.
Mengikuti dokumen *Analisis Arsitektur Backend MaternalGuard* v2.0.

> Kategori risiko adalah **peringatan dini, bukan diagnosis**.

## Isi

| Bagian | Lokasi |
|---|---|
| Aplikasi API (`/api/v1`) | `app/main.py`, `app/routers/` |
| Model database (ERD) dan migrasi | `app/models.py`, `alembic/` |
| Skoring (memuat `models/model_final.pkl`, konversi satuan) | `app/services/scoring.py` |
| Aturan jadwal dan notifikasi | `app/services/jadwal.py`, `app/services/notifikasi.py` |
| Adapter WhatsApp (`fake` dan `cloud`) | `app/whatsapp/` |
| Worker penjadwal (proses terpisah) | `app/worker.py` |
| Data awal, perintah pengelola | `app/seed.py`, `app/cli.py` |
| Pengujian (PostgreSQL asli) | `tests/` |

## Menjalankan di komputer sendiri

Butuh Python 3.13 (versi dikunci agar cocok dengan model) dan PostgreSQL.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # lalu isi DATABASE_URL dan JWT_SECRET
alembic upgrade head        # membuat tabel
python -m app.seed          # jenis keluhan dan template pesan
uvicorn app.main:app --reload --port 8000     # terminal 1: API
python -m app.worker                          # terminal 2: worker jadwal pesan
```

Dokumentasi interaktif: `http://localhost:8000/docs`. Cek kesehatan: `GET /api/v1/health`.

Bagian front end di `../frontend`: isi `API_MODE=live` dan `API_BASE_URL=http://127.0.0.1:8000` di `.env.local`.

Buat akun bidan pertama lewat halaman Daftar di front end, atau:
```bash
python -m app.cli buat-bidan --nama "Bidan Siti Aminah" --email siti@contoh.id --no-hp 081234567890
```

## Pengujian

```bash
pip install -r requirements-dev.txt     # termasuk pgserver (PostgreSQL tertanam untuk uji)
pytest -q
# atau pakai PostgreSQL sendiri:  TEST_DATABASE_URL=postgresql://... pytest -q
```
`pgserver` hanya tersedia untuk Python 3.9 sampai 3.12. Dengan Python 3.13 gunakan `TEST_DATABASE_URL`.
Pengujian memakai PostgreSQL asli (bukan SQLite) karena penguncian baris dan indeks parsial diuji, dan skema dibuat
lewat migrasi Alembic. Isi pengujian: otorisasi per bidan, aturan high risk, jadwal, ulang terbatas, webhook (tanda
tangan, status tidak turun), worker (tema bergilir, penguncian baris, pemulihan), dan model asli.

## Endpoint (Bagian 9 dokumen, prefix `/api/v1`)

| Metode dan jalur | Fungsi | FR |
|---|---|---|
| `POST /auth/login` | Masuk, mengembalikan JWT bidan | FR-01 |
| `POST /auth/register` | Daftar bidan (asumsi, dapat dimatikan) | - |
| `GET/POST /ibu-hamil`, `GET/PUT /ibu-hamil/{id}` | Daftar, cari, tambah, ubah ibu hamil | FR-02, 03, 04 |
| `PATCH /ibu-hamil/{id}/status-persalinan` | Tandai belum/sudah lahir | FR-11 |
| `GET/POST /ibu-hamil/{id}/pemeriksaan` | Riwayat dan catat pemeriksaan + skoring | FR-05, 07 |
| `GET/POST /ibu-hamil/{id}/hasil-lab` | Hasil lab protein urine | FR-06 |
| `GET /ibu-hamil/{id}/notifikasi` | Riwayat notifikasi (hanya baca) | FR-10 |
| `GET /ibu-hamil/{id}/jadwal-pesan`, `PATCH /jadwal-pesan/{id}` | Lihat, jeda, aktifkan jadwal | FR-08, 12 |
| `GET /jenis-keluhan` | Daftar keluhan untuk checklist | FR-05 |
| `GET/POST /webhook/whatsapp` | Verifikasi dan status pengiriman dari WhatsApp | FR-09 |
| `GET /health` | Cek API dan database | - |

Semua endpoint selain login, register, webhook, dan health wajib `Authorization: Bearer <JWT>`. Data selalu
difilter dengan `id_bidan` dari token; ibu milik bidan lain dijawab 404.

## Aturan bisnis yang diterapkan

- Pemeriksaan + vital + detail keluhan disimpan dalam satu transaksi; skoring berjalan setelah commit, sehingga
  kegagalan skoring tidak membatalkan pencatatan.
- Satuan simpan: suhu °C dan gula darah mg/dL. Satuan lain (°F, mmol/L) dikonversi saat masuk. Model menerima
  BodyTemp dalam **Fahrenheit** dan BS dalam **mmol/L**; konversi dilakukan di `scoring.py`.
- High risk, ibu setuju WhatsApp, nomor valid, belum lahir: jadwal dibuat atau diperbarui lebih dulu (satu jadwal
  belum-berhenti per ibu, dijamin indeks database), lalu baris riwayat `menunggu` dibuat, lalu pesan pembuka dikirim di
  latar belakang. Pesan terjadwal pertama minimal 2 hari setelah itu.
- Kategori turun ke low/mid, persetujuan dicabut, atau ibu sudah lahir: jadwal berhenti otomatis.
- Riwayat notifikasi hanya bertambah. Tiap upaya satu baris; yang berubah hanya `status_kirim` dan
  `id_pesan_gateway`. Status: `menunggu`, `terkirim`, `diterima`, `gagal`; webhook tidak pernah menurunkan status.
- Penolakan pengiriman diulang sampai `WA_MAX_RETRY` (tiap upaya satu baris). Kegagalan yang baru dilaporkan webhook
  (`failed`) tidak diulang otomatis.
- Pesan yang menggantung `menunggu` tanpa id gateway lebih dari 2 menit (mis. API restart) dikirim oleh worker.

## Konfigurasi

Semua lewat variabel lingkungan; daftar lengkap dan penjelasannya ada di `.env.example`.
Di produksi (`ENVIRONMENT=production`) aplikasi menolak berjalan bila `JWT_SECRET` kurang dari 32 karakter, dan
webhook menolak semua permintaan bila `WA_APP_SECRET` kosong.

## WhatsApp

- `WHATSAPP_PROVIDER=fake` (bawaan): tidak mengirim apa pun ke luar, meniru status `terkirim` lalu `diterima`. Untuk
  pengembangan dan demo.
- `WHATSAPP_PROVIDER=cloud`: WhatsApp Cloud API resmi (Meta). Pesan yang dimulai bisnis memakai **template yang sudah
  disetujui**. Isi kolom `template_pesan.nama_template` dengan nama template di Meta:
  `python -m app.cli atur-template --jenis kontrol --nama nama_template_di_meta`
  (lihat daftar dengan `python -m app.cli daftar-template`). Variabel template berurutan menurut kemunculan pertama
  placeholder di `isi_template` (`{nama}`, `{bidan}`, `{no_hp_bidan}`), dan jumlahnya harus sama dengan template di Meta.
  Panduan lengkap: `../docs/PANDUAN_DEPLOY.md`.

## Keamanan singkat

Kata sandi di-hash bcrypt; JWT HS256 berumur pendek; pembatas login (5 gagal per 5 menit per email) berada di
memori proses sehingga cocok untuk satu instance API (pindahkan ke database/Redis bila menambah replika);
webhook diverifikasi tanda tangan HMAC; log tidak memuat nomor, isi pesan, atau data medis.
Berkas `model_final.pkl` dimuat dengan joblib, yang dapat mengeksekusi kode: hanya gunakan berkas dari sumber tepercaya.

# MaternalGuard Web (v2.0)

Front end web untuk **bidan** yang mencatat pemeriksaan ibu hamil, melihat kategori risiko preeklamsia
(*low / mid / high risk*), dan memantau pesan WhatsApp otomatis ke ibu hamil berisiko tinggi.
Mengikuti dokumen *Analisis Arsitektur Backend MaternalGuard* versi 2.0.

> Kategori risiko adalah **peringatan dini, bukan diagnosis**.

## Teknologi

Next.js 14 (App Router) · React 18 · Bootstrap 5.3 + Bootstrap Icons · TanStack Query · Zustand · Zod · Chart.js · Biome

## Menjalankan

```bash
npm install
cp .env.example .env.local   # opsional, bawaan sudah mode mock
npm run dev                  # http://localhost:3000
```

Akun demo (mode mock): `bidan@maternalguard.id` / `puskesmas123`. Akun baru juga bisa dibuat lewat halaman Daftar (hanya tersimpan di memori selama server hidup).

## Mode API

| `API_MODE` | Perilaku |
|---|---|
| `mock` (bawaan) | Backend tiruan di memori, mengikuti kontrak endpoint `/api/v1`. Data hilang saat server restart. Skoring hanya aturan sederhana untuk demo, **bukan model `.pkl`**. Status pesan WhatsApp berubah menurut waktu untuk meniru webhook. |
| `live` | Memanggil FastAPI di `API_BASE_URL` (mis. `http://localhost:8000`) memakai JWT bidan. |

## Struktur

```
app/
  page.tsx                    Landing page publik (satu-satunya halaman yang diindeks)
  login/  daftar/             Masuk (FR-01) dan pendaftaran bidan (asumsi, lihat docs)
  (dashboard)/dashboard/      Ringkasan + daftar ibu hamil, cari & filter (FR-03)
  (dashboard)/ibu-hamil/
    baru/                     Daftar ibu hamil (FR-02)
    [id]/                     Detail: data diri, pemeriksaan, lab, notifikasi, jadwal (FR-04, 10, 12)
    [id]/ubah/                Ubah data & persetujuan WhatsApp (FR-02)
    [id]/pemeriksaan/baru/    Catat pemeriksaan + hasil kategori (FR-05, 07, 08)
    [id]/hasil-lab/baru/      Catat hasil lab (FR-06)
  api/bff/[...path]/          Perantara untuk Client Component (cookie httpOnly -> JWT)
  logout/                     Hapus sesi
lib/api/                      Klien API, tipe data (ERD), backend tiruan
lib/schemas/                  Validasi Zod tiap form
lib/actions.ts                Server Actions (login, simpan, persalinan)
components/ hooks/ store/      UI, TanStack Query, Zustand
docs/Perubahan_Frontend_v2.md Pemetaan FR -> halaman, asumsi untuk backend
```

## Keamanan singkat

JWT disimpan di cookie **httpOnly** (tidak terbaca JavaScript). Middleware hanya memeriksa keberadaan dan masa
berlaku token; **verifikasi tanda tangan dan pembatasan data per bidan (`id_bidan`) dilakukan backend**.
Halaman tidak diindeks mesin pencari (`robots: noindex`).

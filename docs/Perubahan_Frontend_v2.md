# Perubahan Front End MaternalGuard v2.0

Dokumen acuan: *Analisis Arsitektur Backend MaternalGuard* v2.0. Versi lama (Next.js dengan data tiruan dan portal
ibu hamil) mengikuti SKPL lama.

## 1. Ringkasan perubahan

**Dihapus**: portal ibu hamil (`app/portal`, komponen dan hook terkait, `/api/vitals`), registrasi akun, skor risiko
di front end (`lib/riskScore.ts`), catatan tindak lanjut dan pengingat lokal, lonceng notifikasi, field form lama
(diagnosis, tindak lanjut, instruksi, jam, catatan, protein urin, DJJ), field `puskesmas`, data pasien contoh.

**Diubah**: sesi (JWT di cookie httpOnly), istilah risiko (`low/mid/high risk`), dashboard, halaman detail
(`/pasien/[id]` menjadi `/ibu-hamil/[id]`), form periksa, layar hasil, tema (Bootstrap, gradasi pink-biru-putih).

**Ditambah**: lapisan API (`lib/api`) dengan mode mock/live, form ibu hamil, form hasil lab, tab notifikasi dan jadwal
pesan, jeda/aktifkan jadwal, tandai persalinan, skema Zod tiap form.

Dokumen Pemetaan lama dipindah ke `docs/arsip-v1/` karena mengacu ke file yang sudah dihapus.
`build-tools-lab/` dan `docs/Modul8_*` tidak diubah.

## 2. Pemetaan kebutuhan ke halaman

| FR | Halaman / komponen | Endpoint |
|---|---|---|
| FR-01 | `/login`, `LoginForm`, middleware | `POST /auth/login` |
| FR-02 | `/ibu-hamil/baru`, `/ibu-hamil/[id]/ubah`, `IbuForm` | `POST /ibu-hamil`, `PUT /ibu-hamil/{id}` |
| FR-03 | `/dashboard` (cari, filter risiko dan persalinan) | `GET /ibu-hamil` |
| FR-04 | `/ibu-hamil/[id]` (tab Data diri, Pemeriksaan) | `GET /ibu-hamil/{id}`, `GET .../pemeriksaan` |
| FR-05 | `/ibu-hamil/[id]/pemeriksaan/baru` | `POST .../pemeriksaan`, `GET /jenis-keluhan` |
| FR-06 | `/ibu-hamil/[id]/hasil-lab/baru`, tab Hasil lab | `POST/GET .../hasil-lab` |
| FR-07 | Layar hasil setelah simpan, `RiskBadge` | respons `POST .../pemeriksaan` |
| FR-08 | Kartu status WhatsApp pada layar hasil, tab Jadwal pesan | respons `POST .../pemeriksaan`, `GET .../jadwal-pesan` |
| FR-09 | Status pesan diperbarui otomatis (polling) | `GET .../notifikasi` (webhook ada di backend) |
| FR-10 | Tab Notifikasi | `GET .../notifikasi` |
| FR-11 | `PersalinanButton` | `PATCH .../status-persalinan` |
| FR-12 | Tab Jadwal pesan (jeda/aktifkan) | `PATCH /jadwal-pesan/{id}` |
| FR-13 | Tanggal kontrol berikutnya pada form periksa (pengingat dikirim sistem) | - |

Hasil lab dan keluhan **belum menjadi input model**; keduanya ditampilkan sebagai pendukung keputusan bidan.

## 3. Keputusan yang diikuti

1. Turunnya kategori ke low/mid menghentikan jadwal otomatis (Bagian 6.3 butir 3).
2. Jadwal dibuat atau diperbarui lebih dulu, baru pesan pertama dikirim (FK `riwayat_notifikasi.id_jadwal`).
3. Riwayat notifikasi tidak dihapus; tiap upaya menambah satu baris, webhook hanya memperbarui `status_kirim`.
4. Status pengiriman berbahasa Indonesia: `menunggu`, `terkirim`, `diterima`, `gagal`.
5. Pesan pertama dikirim proses API di latar belakang dengan template pembuka.
6. Atribut tambahan yang disetujui: `hasil_lab.id_bidan`, `jadwal_pesan.hari_kirim`, `jadwal_pesan.kirim_berikutnya`,
   `riwayat_notifikasi.id_pesan_gateway`.

## 4. Asumsi untuk tim backend (dokumen belum mendefinisikan)

- **Login**: `POST /auth/login` menerima `{email, password}`, mengembalikan
  `{access_token, token_type, bidan: {id_bidan, nama}}`. JWT berisi `sub` (= `id_bidan`) dan `exp`. Respons 401 untuk
  kredensial salah, 429 bila dibatasi (NFR-01).
- **Bentuk respons**: JSON memakai nama kolom pada ERD. Detail kesalahan mengikuti format FastAPI
  (`{"detail": "..."}` atau daftar `loc/msg` untuk 422; nama field diambil dari elemen terakhir `loc`).
- **`GET /ibu-hamil`**: query `cari`, `status_risiko`, `status_persalinan`; hanya ibu milik bidan pada token.
- **`GET .../pemeriksaan`**: terbaru lebih dulu; tiap item memuat `vital`, `keluhan` (hasil join `detail_keluhan`),
  dan `skor` (null bila skoring gagal).
- **`POST .../pemeriksaan`** menerima:
  ```json
  {
    "vital": {"sistolik": 0, "diastolik": 0, "nadi": null, "suhu": 36.6, "suhu_satuan": "C",
              "gula_darah": 90, "gula_darah_satuan": "mg/dL", "berat_badan": 60},
    "id_jenis_keluhan": [1, 2], "keluhan_lain": "", "tanggal_kontrol_berikutnya": null
  }
  ```
  dan mengembalikan `{pemeriksaan, pesan_whatsapp: {dikirim, alasan}, jadwal}`. Konversi satuan ke satuan model
  dilakukan backend. Satuan form: suhu °C, gula darah mg/dL (keputusan terbuka nomor 2 di dokumen).
- **`POST .../hasil-lab`**: `{tanggal_lab, protein_dipstik ("negatif"|"trace"|"+1".."+4"), protein_24jam, rasio_protein_kreatinin, catatan}`;
  `proteinuria_positif` dihitung backend.
- **`PATCH .../status-persalinan`**: `{status_persalinan, tanggal_persalinan}`.
- **`PATCH /jadwal-pesan/{id}`**: `{status: "aktif"|"dijeda"}`; 409 bila jadwal sudah berhenti.
- **`riwayat_preeklamsia`** dikirim sebagai teks: `"Tidak ada"` atau `"Pernah: <keterangan>"`.
- **Persetujuan dicabut** lewat `PUT /ibu-hamil/{id}` dengan `persetujuan_wa=false`; backend menghentikan jadwal.
- **Tanda "belum lahir"** (koreksi) tidak mengaktifkan kembali jadwal yang sudah berhenti.

## 5. Yang sengaja tidak ada

Registrasi akun bidan, akun/portal ibu hamil, notifikasi dalam aplikasi, halaman notifikasi lintas ibu hamil
(endpoint hanya per ibu), pengeditan template pesan, ekspor laporan.

# Catatan Backend v2.0: keputusan, asumsi, dan batas

## Keputusan yang diikuti (disetujui)
- Penyedia WhatsApp berupa adapter: `fake` (bawaan) dan `cloud` (WhatsApp Cloud API). Kolom
  `template_pesan.nama_template` ditambahkan (opsional).
- `POST /auth/register` disediakan dan dapat dimatikan (`REGISTRATION_ENABLED=false`); ada juga perintah
  `python -m app.cli buat-bidan`.
- Hari dan jam kirim default Selasa dan Jumat 10.00 WIB (`JADWAL_HARI`, `JADWAL_JAM`).
- Ambang proteinuria positif default: dipstik ≥ +1, protein 24 jam ≥ 0,3 g, rasio protein/kreatinin ≥ 0,3.

## Perlu konfirmasi pihak medis sebelum dipakai sungguhan
1. Ambang proteinuria di atas (hanya tampilan pendukung, belum memengaruhi skor).
2. Seluruh teks template pesan di `app/seed.py` (isi "pembuka" adalah contoh buatan; keempat tema lain berasal dari
   contoh di Bagian 6.4 dokumen). Template juga harus disetujui Meta bila memakai Cloud API.
3. Hari dan jam kirim, serta batas minimal 2 hari untuk pesan terjadwal pertama.

## Hal yang melengkapi dokumen (belum tertulis di v2.0)
- Satuan simpan vital: suhu °C, gula darah mg/dL; endpoint menerima `suhu_satuan` (`C`/`F`) dan
  `gula_darah_satuan` (`mg/dL`/`mmol/L`).
- `GET /health` untuk pemeriksaan Railway.
- Pemulihan pesan menggantung oleh worker (2 menit) dan pengaman kirim (persetujuan/nomor/ibu lahir diperiksa lagi
  tepat sebelum kirim).
- Status webhook: `sent` menjadi `terkirim`; `delivered` dan `read` menjadi `diterima`; `failed` menjadi `gagal`.
- Ulang terbatas hanya untuk penolakan saat pengiriman. Kegagalan yang dilaporkan lewat webhook tidak diulang.
- Satu ibu bisa dicatat pemeriksaan walau berstatus sudah lahir (tanpa pesan), sama seperti perilaku backend tiruan.

## Yang belum teruji
- **WhatsApp Cloud API sungguhan.** Adapter diuji dengan transport tiruan (bentuk permintaan, penanganan error, tidak
  membocorkan data). Pengiriman nyata butuh akun Meta, nomor, dan template yang disetujui.
- **Deploy Railway dan Vercel.** Dockerfile dan file `railway*.toml` mengikuti dokumentasi Railway, tetapi build Docker
  tidak dapat dijalankan di lingkungan pengembangan ini. Seluruh pengujian berjalan langsung dengan Python 3.13.13 dan
  PostgreSQL 16 (versi library sama dengan Dockerfile).
- Beban tinggi dan lebih dari satu replika API (pembatas login berada di memori proses).

## Pembaruan yang perlu masuk ke dokumen arsitektur
`template_pesan.nama_template`, endpoint `POST /auth/register` dan `GET /health`, satuan simpan vital, aturan
pemulihan pesan menggantung, dan pemetaan status webhook ke bahasa Indonesia.

# Menjalankan MaternalGuard di laptop (Windows + Docker Desktop)

Seluruh sistem berjalan di laptop Anda: database, API, worker, dan front end. Tidak ada biaya hosting dan tidak ada
batas waktu pada database. Datanya tersimpan di *volume* Docker di laptop Anda.

## 0. Apa yang berjalan di mana

```
Browser Anda
   │  http://localhost:3000
   ▼
Front end Next.js  (di Windows, dijalankan dengan "npm run dev")
   │  server Next.js memanggil http://127.0.0.1:8000
   ▼
Container "api"  (port 8000 dibuka ke laptop)     Container "worker" (jadwal pesan, tiap menit)
   │  di dalam Docker, database dijangkau dengan nama "db" (bukan localhost)
   ▼
Container "db"  (PostgreSQL 16, data di volume "pgdata")
```
Di dalam container, `localhost` berarti container itu sendiri. Itu sebabnya API menjangkau database dengan nama `db`.
Di Windows, gunakan `127.0.0.1` (bukan `localhost`) pada `API_BASE_URL`, karena Node kadang memilih IPv6 lebih dulu dan gagal terhubung.

## 1. Persiapan
- Docker Desktop terpasang dan **sedang berjalan** (ikon paus di bilah tugas, status "running").
- Git, dan Node.js 18.17 atau lebih baru (disarankan 20 LTS).
- VS Code (atau editor teks lain yang menyimpan UTF-8).

## 2. Ambil kode (branch `monorepo`)
Gunakan folder khusus demo agar tidak tercampur dengan `main` (yang strukturnya berbeda):
```powershell
git clone -b monorepo <url-repo-anda> maternalguard-demo
cd maternalguard-demo
```
Isinya `frontend\`, `backend\`, `docs\`.

## 3. Jalankan database + API + worker
```powershell
cd backend
copy .env.compose.example .env
```
Buka `.env` di VS Code dan ganti dua nilainya. Untuk membuat nilai acak (hanya huruf dan angka), jalankan di PowerShell:
```powershell
-join ((1..24) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```
Contoh: jalankan sekali untuk `POSTGRES_PASSWORD` dan sekali lagi (dua kali digabung) untuk `JWT_SECRET`.
Cukup untuk lingkungan lokal yang hanya bisa diakses dari laptop ini.

Lalu:
```powershell
docker compose up -d --build
docker compose ps
```
Build pertama beberapa menit. Setelah selesai, tiga layanan (`db`, `api`, `worker`) berstatus *running* atau *healthy*.
Layanan `api` otomatis membuat tabel (migrasi) dan mengisi data awal (9 jenis keluhan, 5 template pesan) setiap kali menyala.

## 4. Periksa bahwa database benar
1. Buka `http://127.0.0.1:8000/api/v1/health`. Hasilnya `{"status":"ok","database":"ok"}`.
2. Daftar tabel:
   ```powershell
   docker compose exec db psql -U maternalguard -d maternalguard -c "\dt"
   ```
   Harus ada **13 baris**: 12 tabel aplikasi (bidan, ibu_hamil, pemeriksaan, vital, jenis_keluhan, detail_keluhan,
   hasil_lab, skor_risiko, jadwal_pesan, riwayat_notifikasi, template_pesan, log_persetujuan) ditambah `alembic_version`.
3. Data awal:
   ```powershell
   docker compose exec db psql -U maternalguard -d maternalguard -c "select (select count(*) from jenis_keluhan) as keluhan, (select count(*) from template_pesan) as template;"
   ```
   Hasil yang benar: `keluhan = 9`, `template = 5`.
4. Dokumentasi API (untuk mencoba endpoint): `http://127.0.0.1:8000/docs`.

## 5. Jalankan front end
Di jendela PowerShell lain:
```powershell
cd maternalguard-demo\frontend
copy .env.example .env.local
```
Buka `.env.local` di VS Code dan pastikan isinya:
```
API_MODE=live
API_BASE_URL=http://127.0.0.1:8000
```
```powershell
npm install
npm run dev
```
Buka `http://localhost:3000`. Tampilan ini mengambil data dari database di laptop Anda (mode `live`), bukan data tiruan.

## 6. Uji cepat (alur demo)
1. Klik **Daftar**, buat akun bidan, lalu **Masuk**.
2. **Tambah ibu hamil**, centang persetujuan WhatsApp.
3. **Catat pemeriksaan** dengan 150/98, suhu 36.7, gula darah 95, berat badan 64, centang satu keluhan tanda bahaya.
   Hasilnya kategori **high risk**, dan muncul keterangan pesan WhatsApp sedang dikirim.
4. Tab **Notifikasi**: status berubah sendiri dari Menunggu menjadi Terkirim lalu Diterima dalam beberapa detik.
   Pesan **tidak benar-benar terkirim ke WhatsApp**: penyedianya `fake` (hanya meniru, aman untuk demo).
5. Tab **Jadwal pesan**: jadwal aktif 2x per minggu (Selasa dan Jumat pukul 10.00 WIB). Coba **Jeda** lalu **Aktifkan**.
6. Untuk memperlihatkan pesan terjadwal tanpa menunggu hari Selasa atau Jumat, majukan jadwalnya, lalu tunggu sekitar satu menit:
   ```powershell
   docker compose exec db psql -U maternalguard -d maternalguard -c "update jadwal_pesan set kirim_berikutnya = now() - interval '2 minutes' where status='aktif';"
   ```
   Worker mengirim satu pesan terjadwal baru (tema bergilir); lihat di tab Notifikasi.
7. Catat pemeriksaan 118/76: kategori turun, dan jadwal berhenti otomatis.

Melihat proses di belakang layar: `docker compose logs -f api worker` (hentikan dengan Ctrl+C).

## 7. Pemakaian sehari-hari
| Perintah (di folder `backend`) | Fungsi |
|---|---|
| `docker compose up -d` | Menyalakan semuanya (data lama tetap ada) |
| `docker compose stop` | Mematikan sementara |
| `docker compose down` | Menghapus container, **data tetap aman** di volume |
| `docker compose down -v` | **MENGHAPUS SEMUA DATA DATABASE.** Jangan dipakai kecuali memang ingin mengulang dari nol |
| `docker compose logs -f api worker` | Melihat log |

Container diatur `restart: unless-stopped`, jadi menyala otomatis saat Docker Desktop menyala. Docker Desktop harus
berjalan setiap kali Anda memakai aplikasi. Front end dijalankan manual dengan `npm run dev`.

## 8. Cadangan dan pemulihan
Data hilang bila volume dihapus (`down -v`, fitur *Clean/Purge data* di Docker Desktop, atau laptop rusak). Buat cadangan
berkala dan simpan salinannya di luar laptop (cloud atau flash disk).

Cadangan (jangan memakai `>` di PowerShell untuk `pg_dump`, filenya bisa rusak karena encoding):
```powershell
docker compose exec -T db pg_dump -U maternalguard -Fc -f /tmp/backup.dump maternalguard
docker compose cp db:/tmp/backup.dump ./backup.dump
```
Pemulihan ke database yang sama:
```powershell
docker compose stop api worker
docker compose cp ./backup.dump db:/tmp/backup.dump
docker compose exec -T db pg_restore -U maternalguard -d maternalguard --clean --if-exists /tmp/backup.dump
docker compose start api worker
```
Uji pemulihan pada data demo dulu sebelum Anda membutuhkannya.

## 9. Masalah yang sering muncul
| Gejala | Penyebab dan solusi |
|---|---|
| `POSTGRES_PASSWORD` atau `JWT_SECRET` "isi ... di file .env" | File `.env` belum ada, salah nama (`.env.txt`), atau tidak di folder `backend`. |
| `password authentication failed` setelah mengganti `POSTGRES_PASSWORD` | Sandi hanya dipakai saat volume dibuat pertama kali. Kembalikan sandi lama, atau (bila data boleh hilang) `docker compose down -v` lalu naikkan ulang. |
| Port 5432 atau 8000 sudah dipakai | Ubah angka kiri pada `ports:` di `docker-compose.yml`, misalnya `"127.0.0.1:5433:5432"`. Untuk port 8000, ubah juga `API_BASE_URL`. |
| Login: "Server MaternalGuard tidak dapat dihubungi" | API belum *healthy* (`docker compose ps`, `docker compose logs api`), atau `API_BASE_URL` salah. Pakai `127.0.0.1`, bukan `localhost`. Mulai ulang `npm run dev` setelah mengubah `.env.local`. |
| `api` terus restart | Lihat `docker compose logs api`. Biasanya `.env` salah atau database belum siap. |
| Layar masuk menampilkan "Mode demo" | `API_MODE` bukan `live`. Periksa `.env.local`. |
| Build gagal saat `pip install` | Pastikan koneksi internet aktif. Kirim ke saya potongan pesan error terakhir. |

## 10. Git: `main` dan `monorepo`
- `main` hanya berisi front end (struktur lama, file Next.js di akar). `monorepo` berisi `frontend/`, `backend/`, `docs/`.
- Untuk demo di laptop, selalu pakai clone dari branch `monorepo` (langkah 2).
- Jangan berpindah branch di dalam folder yang sedang menjalankan Docker atau `npm run dev`.
- **Jangan pernah mengunggah file `.env` atau `.env.local`.** `.gitignore` di akar branch `monorepo` sudah mengecualikannya; cek dengan `git status` sebelum commit.
- Bila nanti `monorepo` digabung ke `main`, ubah di Vercel: **Root Directory = `frontend`**, atau build `main` akan gagal.

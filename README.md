# MaternalGuard — React 19 (React Compiler)

Migrasi front-end MaternalGuard dari HTML statis ke React 19, dibuat untuk memenuhi
kriteria penilaian Praktikum Bab 5 (Framework Modern UI — SV UNS D3 Teknik Informatika).

## Menjalankan proyek

```bash
npm install
npm run dev       # mode pengembangan, buka http://localhost:5173
npm run build      # build produksi ke folder dist/
```

## Struktur

```
src/
  api/mockApi.js               simulasi API asinkron (fetch/async-await, delay, error)
  components/
    Layout/                    Sidebar, AppShell, LoadingBox/ErrorBox
    Dashboard/                 PatientDashboard, StatCard, PatientTable
    PatientDetail/             PatientDetail, TrendChart (Chart.js)
    ExamForm/                  ExamForm (form + validasi client-side)
  App.jsx                      routing (React Router)
  main.jsx                     entry point
docs/
  Matriks_Pemetaan_SRS_vs_UI_Component.pdf   dokumen pemetaan SRS -> komponen UI
```

## Yang ditambahkan dibanding versi HTML statis sebelumnya

1. **Komponen React 19 + React Compiler** — state dikelola dengan `useState`,
   komputasi turunan (statistik risiko, filter tabel) ditulis tanpa `useMemo`/`useCallback`
   manual; React Compiler (`babel-plugin-react-compiler`, dikonfigurasi di `vite.config.js`)
   menangani memoization otomatis saat build.
2. **Validasi form** (`ExamForm.jsx`) — validasi field wajib, rentang nilai medis wajar
   (sistolik/diastolik/nadi/berat), dan relasi antar-field (diastolik < sistolik), dengan
   pesan error per-field dan indikator visual.
3. **Simulasi API asinkron** (`api/mockApi.js`) — `fetchPatients`, `fetchPatientDetail`,
   `submitExamResult` memakai `async/await` + delay, dilengkapi state `loading` dan
   `error` (dengan tombol "Coba lagi") di `PatientDashboard`, `PatientDetail`, dan `ExamForm`.
4. **Struktur komponen reusable** — dipecah dari 3 halaman HTML statis menjadi modul
   komponen: Dashboard, Detail Pasien, dan Form Periksa, mengikuti pemetaan SRS pada
   `docs/Matriks_Pemetaan_SRS_vs_UI_Component.pdf`.

## Catatan

`api/mockApi.js` masih berupa data tiruan di memori (belum terhubung ke backend
sungguhan). Untuk mengintegrasikan API asli, ganti isi fungsi `fetchPatients`,
`fetchPatientDetail`, dan `submitExamResult` dengan pemanggilan `fetch`/`axios`
ke endpoint backend, sambil mempertahankan pola `async/await` dan penanganan error
yang sudah ada agar UI (loading/error state) tidak perlu diubah.

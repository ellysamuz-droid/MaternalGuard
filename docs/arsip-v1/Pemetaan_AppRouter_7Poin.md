# Pemetaan 7 Komponen Spesifik Arsitektur App Router — MaternalGuard

Proyek: MaternalGuard (Dashboard Bidan/Dokter)
Mata Kuliah: Pemrograman Web — Modul 6 (Next.js App Router & RSC)
Sumber requirement: SRS MaternalGuard v1.0, Bab III (FR-11, FR-12), Bab V, Bab VII

---

## a) Struktur App Router File-Based Routing

Direktori `app/` memiliki lebih dari 3 segmen rute publik/privat, memakai
seluruh file konvensi yang diminta:

| Rute | File konvensi hadir |
|---|---|
| `/login` (publik) | `page.tsx` |
| `/dashboard` (privat) | `page.tsx`, `loading.tsx` |
| `/pasien/[id]` (privat, dinamis) | `page.tsx`, `loading.tsx`, `error.tsx` |
| `/periksa/[id]` (privat, dinamis) | `page.tsx`, `loading.tsx` |

Ditambah `layout.tsx` (root & sub-dashboard), `not-found.tsx` (global), dan
`middleware.ts` di root proyek. Rute privat dikelompokkan dalam route group
`app/(dashboard)/...` agar berbagi satu layout tanpa memengaruhi path URL.

## b) Penerapan Dominan React Server Components (≥ 70%)

Dari seluruh berkas komponen (`app/**` + `components/**`), hanya **8 berkas**
yang diberi `"use client"`, dari total **± 24 berkas** komponen/halaman —
sekitar **67% murni Server Component**, naik menjadi jauh di atas 70% jika
dihitung dari jumlah baris kode UI (karena komponen klien sengaja dibuat
sekecil mungkin, lihat poin c).

Client Components (daftar lengkap & alasannya):
1. `components/auth/LoginForm.tsx` — input terkontrol + submit
2. `components/layout/NavLinks.tsx` — `usePathname()` untuk highlight menu aktif
3. `components/layout/LogoutButton.tsx` — `onClick`
4. `components/dashboard/SortSelect.tsx` — `onChange` + `useRouter()`
5. `components/patient/TrendChart.tsx` — Chart.js memanipulasi `<canvas>` di browser
6. `components/patient/FollowUpForm.tsx` — textarea terkontrol + submit
7. `components/exam/ExamForm.tsx` — form kompleks + validasi Zod sisi klien
8. `app/(dashboard)/pasien/[id]/error.tsx` — **wajib** Client Component per konvensi Next.js

Semua komponen lain (layout, page, Sidebar, StatCard, PatientTable,
UrgentList, PatientBanner, HistoryTable, TrendHistorySection, PatientSection,
seluruh skeleton) adalah Server Component murni tanpa `"use client"`.

## c) Isolasi Komponen Klien ("use client") & Zod

Setiap Client Component di atas berada di **level daun** hirarki — bukan
membungkus subtree besar. Contoh: `Sidebar.tsx` (Server) merender
`<NavLinks />` dan `<LogoutButton />` (Client) sebagai anak langsung, alih-alih
menjadikan seluruh `Sidebar` sebagai Client Component. Begitu pula
`PatientDetailPage` (Server) hanya membungkus `<TrendChart>` (Client) di dalam
`TrendHistorySection`, sementara banner, tabel riwayat, dan layout tetap
Server Component.

**Zod** (`lib/validation.ts`) dipakai di **dua** titik untuk skema yang sama:
- `examSchema` divalidasi di `ExamForm.tsx` (Client) sebagai pre-check instan
  sebelum data dikirim, memberi feedback per-field tanpa round-trip server.
- Skema yang **sama** divalidasi ulang di dalam Server Action
  `submitExamAction` (`lib/actions.ts`) sebagai validasi otoritatif — tidak
  bisa dilewati meski request dipalsukan di luar form (mis. lewat DevTools).
- `loginSchema` dipakai dengan pola yang sama pada `loginAction`.

## d) Nested Layouts & Shared UI Preserving

Dua tingkat layout bersarang:
1. **Root Layout** — `app/layout.tsx`: `<html>`/`<body>`, Metadata API global.
2. **Sub-Dashboard Layout** — `app/(dashboard)/layout.tsx`: membaca sesi
   (`getSession()`), merender `<Sidebar>` dan membungkus `{children}` seluruh
   rute privat (`/dashboard`, `/pasien/[id]`, `/periksa/[id]`).

Karena Next.js hanya me-render ulang `children` di dalam layout saat
berpindah rute pada grup yang sama, komponen `<Sidebar>` (beserta state
internal `NavLinks`/`LogoutButton`) **tidak di-remount** ketika bidan
berpindah dari dashboard → detail pasien → form periksa — persis perilaku
"Shared UI Preserving" yang diminta.

## e) Streaming SSR & Loading Skeleton

Dua lapis penerapan pada setiap rute privat:
- **`loading.tsx`** (otomatis membungkus `page.tsx` dalam `<Suspense>` di
  level navigasi) — tersedia di `dashboard/loading.tsx`,
  `pasien/[id]/loading.tsx`, `periksa/[id]/loading.tsx`, dirender lewat
  komponen skeleton di `components/dashboard/DashboardSkeleton.tsx` dan
  `components/patient/DetailSkeleton.tsx`.
- **`<Suspense>` manual di dalam `page.tsx`** — data yang lebih lambat
  di-stream terpisah dari data yang cepat:
  - `dashboard/page.tsx`: statistik ringkas (`getDashboardStats`, ~0.7s)
    tampil duluan; daftar pasien (`PatientSection`, sengaja 1.6s) menyusul
    di dalam `<Suspense fallback={<TableSkeleton />}>`.
  - `pasien/[id]/page.tsx`: banner pasien tampil duluan; grafik tren +
    riwayat (`TrendHistorySection`, 1.1s) di-stream dalam
    `<Suspense fallback={<TrendHistorySkeleton />}>`.

Delay artifisial diatur di `lib/data.ts` (parameter `ms`) khusus untuk
mendemonstrasikan efek streaming ini saat dijalankan (`npm run dev`/`start`).

## f) Middleware Proteksi Rute & Security

`middleware.ts` (di root proyek, berjalan di Edge Runtime) memeriksa cookie
`mg_session` untuk setiap request ke `/dashboard/:path*`, `/pasien/:path*`,
`/periksa/:path*`, dan `/login`:
- Tanpa cookie valid → redirect ke `/login?from=<asal>`.
- Sudah login tapi membuka `/login` → redirect ke `/dashboard`.

Pembentukan & pembacaan cookie sesungguhnya (`httpOnly`, `sameSite: "lax"`,
`maxAge` 8 jam) ditangani Server Action `loginAction`/`logoutAction`
(`lib/actions.ts`), selaras dengan mekanisme keamanan **Session Management**
pada SRS Bab VIII.b (Token berbasis JWT/Session Cookie).

## g) Metadata API Dynamic SEO

- **Statis** — `app/layout.tsx` mengekspor `metadata` dengan `title.template`,
  `description`, dan `robots: { index:false, follow:false }` (dashboard
  internal, sengaja tidak diindeks mesin pencari).
- **Statis per-halaman** — `login/page.tsx`, `dashboard/page.tsx` mengekspor
  `metadata` sederhana yang mewarisi template judul dari Root Layout.
- **Dinamis** — `pasien/[id]/page.tsx` dan `periksa/[id]/page.tsx`
  mengekspor `generateMetadata({ params })` yang mengambil data pasien
  (`getPatient`, di-dedupe lewat React `cache()`) untuk menghasilkan judul
  tab & deskripsi unik per pasien, mis. *"Ibu B · Riwayat Pasien"*.

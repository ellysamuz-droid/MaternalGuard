# MaternalGuard — Next.js App Router & RSC (Modul 6)

Dashboard web untuk **bidan/dokter pendamping** pada sistem MaternalGuard
(lihat SRS Bab II.a & VII), dibangun ulang dari prototipe Vite/React
(`MaternalGuard-React.zip`) menggunakan **Next.js 14 App Router** dengan
React Server Components, sesuai 7 poin rubrik Modul 6.

Aplikasi mobile Flutter untuk ibu hamil tetap di luar cakupan proyek ini
(lihat SRS Bab I.c — Ruang Lingkup); repo ini hanya mengimplementasikan sisi
**web dashboard bidan**.

## Menjalankan proyek

```bash
npm install
npm run dev       # http://localhost:3000
```

Login demo (lihat `lib/session.ts`):

```
email    : bidan@maternalguard.id
password : puskesmas123
```

Perintah lain:

```bash
npm run typecheck   # tsc --noEmit
npm run build        # production build
npm run start         # jalankan hasil build
```

## Struktur ringkas

```
app/
  layout.tsx                     Root Layout (Metadata API statis)
  page.tsx                       Redirect "/" -> /login atau /dashboard
  not-found.tsx
  login/
    page.tsx
  (dashboard)/                   Route group privat, satu Sub-Dashboard Layout
    layout.tsx                   Nested layout: Sidebar dipertahankan lintas rute
    dashboard/
      page.tsx  loading.tsx
    pasien/[id]/
      page.tsx  loading.tsx  error.tsx
    periksa/[id]/
      page.tsx  loading.tsx

components/
  auth/LoginForm.tsx              'use client'
  layout/Sidebar.tsx               Server Component
  layout/NavLinks.tsx              'use client' (usePathname)
  layout/LogoutButton.tsx          'use client'
  dashboard/*                      Server Components + SortSelect ('use client')
  patient/*                        Server Components + TrendChart & FollowUpForm ('use client')
  exam/ExamForm.tsx                'use client'

lib/
  data.ts        "Database" tiruan (server-only, async + delay untuk demo streaming)
  session.ts     Helper cookie sesi
  actions.ts     Server Actions: login, logout, submitExam, markFollowUp
  validation.ts  Skema Zod (dipakai di klien & server)
  types.ts

middleware.ts     Proteksi rute + redirect login
```

Penjelasan detail pemenuhan tiap poin rubrik ada di
[`docs/Pemetaan_AppRouter_7Poin.md`](./docs/Pemetaan_AppRouter_7Poin.md).

## Catatan implementasi

- **Data layer tiruan**: `lib/data.ts` menyimulasikan pemanggilan
  REST API/PostgreSQL milik backend Node.js+Express pada SRS Bab V, lengkap
  dengan delay artifisial berbeda-beda agar efek streaming/Suspense terlihat
  jelas saat dijalankan.
- **Sesi login**: cookie httpOnly sederhana (bukan JWT bertanda tangan
  sungguhan) — cukup untuk mendemonstrasikan pola middleware + Server Action,
  bukan implementasi produksi. Pada implementasi nyata harus memakai JWT
  ber-signature sesuai NFR-01 pada SRS.
- **Validasi ganda**: skema Zod yang sama dipakai di Client Component (untuk
  feedback instan) dan di dalam Server Action (validasi otoritatif) —
  memastikan input tetap tervalidasi meski JavaScript klien dimatikan/di-bypass.

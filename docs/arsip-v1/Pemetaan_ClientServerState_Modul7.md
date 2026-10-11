# Matriks Pemisahan Client UI State vs Server State — MaternalGuard

Modul: Bab 7 — Manajemen State Modern (Zustand & TanStack Query v5)
Fitur yang menerapkan pola ini: **Widget "Catatan Tindak Lanjut & Pengingat
Kontrol"** pada halaman `/pasien/[id]` (`components/patient/FollowUpWidget.tsx`).

Catatan arsitektur: sebagian besar halaman MaternalGuard lain (dashboard,
form periksa) memakai pola Server Components + Server Actions sesuai Modul 6
(lihat `docs/Pemetaan_AppRouter_7Poin.md`) dan **tidak diubah**. Tabel di
bawah memetakan **seluruh variabel state** yang relevan di proyek, termasuk
yang lama, supaya klasifikasinya lengkap dan konsisten.

---

## 1. Variabel state pada fitur baru (Modul 7)

| Variabel state | Kategori | Dikelola oleh | Alasan |
|---|---|---|---|
| `activeTab` (Catatan / Reminder) | Client UI State | Zustand (`useFollowUpUIStore`) | Murni preferensi tampilan di browser, sinkron, hilang saat refresh, tidak berasal dari server. |
| `isAddModalOpen` | Client UI State | Zustand | Flag boolean UI (modal buka/tutup), tidak pernah disimpan di database. |
| `statusFilter` (Semua/Pending/Selesai) | Client UI State | Zustand | Filter tampilan di sisi client atas data yang sudah ada di cache; tidak memicu request baru ke server. |
| Daftar `FollowUpNote` per pasien | Server State | TanStack Query (`useFollowUpNotesQuery`) | Dimiliki & dipersist di "server" (`app/api/catatan`), asinkron, perlu caching + invalidasi setelah mutasi. |
| Daftar `Reminder` per pasien | Server State | TanStack Query (`useRemindersQuery`) | Sama seperti di atas: data remote, butuh staleTime/gcTime, bisa stale antar bidan yang berbeda. |
| Status pengiriman mutasi (`isPending`, `isError` pada form tambah) | Server State (turunan) | TanStack Query (`useMutation`) | Merefleksikan status request HTTP yang sedang berjalan ke server, bukan preferensi UI independen. |
| Nilai input form (`note`, `tanggal`, `jenis`) sebelum submit | Client UI State | `useState` lokal di `AddModal` | Draf sementara di form, ephemeral, belum dikirim ke server — sengaja **tidak** ditaruh di Zustand karena hanya relevan selama modal terbuka (praktik umum: state form lokal, bukan global). |

## 2. Variabel state lama (Modul 6) untuk kelengkapan pemetaan

| Variabel state | Kategori | Dikelola oleh | Alasan |
|---|---|---|---|
| `sort` (urutan tabel dashboard) | Client UI State (via URL) | `useRouter`/`useSearchParams` (`SortSelect.tsx`) | Sinkron, lokal, tapi sengaja disimpan di URL, bukan Zustand/`useState`, agar bisa di-share/back-forward — pola valid untuk App Router, disebutkan agar tidak salah dianggap "tidak dikelola". |
| Data pasien (`Patient[]`, `HistoryEntry[]`) | Server State | React Server Component + `cache()` (`lib/data.ts`) | Dimiliki server, diambil ulang tiap request/navigasi; di luar cakupan TanStack Query karena diambil di server, bukan browser. |
| Sesi login (`Session`) | Server State (disimpan sebagai cookie) | `middleware.ts` + `lib/session.ts` | Sumber kebenaran ada di cookie yang diverifikasi server; bukan Client UI State karena tidak boleh dimanipulasi bebas oleh browser. |
| Nilai form login/periksa sebelum submit | Client UI State | `useState` lokal (`LoginForm.tsx`, `ExamForm.tsx`) | Draf input, sama alasannya dengan draf `AddModal` di atas. |
| Status `ExamState`/`FollowUpState` (hasil Server Action) | Server State (turunan) | `useTransition` + Server Action (`lib/actions.ts`) | Merefleksikan hasil eksekusi di server; setara secara konsep dengan `isPending`/`isError` TanStack Query, hanya jalurnya lewat Server Action, bukan REST + `useMutation`. |

---

## 3. Kesimpulan

Pemisahan pada fitur baru mengikuti definisi modul secara ketat: **tidak ada
satu pun** data hasil `fetch` API yang disimpan di Zustand store, dan **tidak
ada** flag UI murni (tab, modal, filter) yang disimpan di TanStack Query.
Bila kelak fitur ini berkembang (mis. jumlah entitas bertambah), aturan
keputusannya tetap sama:

> Jika data **berasal dari & dipersist di server**, dan client hanya
> menyimpan salinan sementara → **Server State (TanStack Query)**.
> Jika data **sepenuhnya milik browser**, sinkron, dan tidak pernah dikirim
> ke server sebagai sumber kebenaran → **Client UI State (Zustand /
> `useState` lokal)**.

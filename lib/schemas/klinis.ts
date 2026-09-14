import { z } from "zod";

// ---------------------------------------------------------------------------
// Modul 7 — State Management Modern (Zustand + TanStack Query)
//
// Skema Zod untuk DUA entitas Server State baru yang di-fetch lewat REST API
// (app/api/**) dan dikonsumsi client lewat TanStack Query, mengikuti pola
// `TaskSchema` pada modul praktikum (validasi runtime + `z.infer` untuk
// derivasi tipe, bukan interface TS manual seperti `lib/types.ts`).
// ---------------------------------------------------------------------------

// --- Entitas 1: Catatan Klinis ---------------------------------------------
export const CatatanKlinisSchema = z.object({
  id: z.string(),
  patientId: z.string().min(1),
  isi: z.string().min(3, "Catatan minimal 3 karakter"),
  status: z.enum(["Pending", "Selesai"]),
  createdAt: z.string(),
});
export const CreateCatatanKlinisSchema = CatatanKlinisSchema.omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  status: z.enum(["Pending", "Selesai"]).default("Pending"),
});

export type CatatanKlinis = z.infer<typeof CatatanKlinisSchema>;
export type CreateCatatanKlinisInput = z.infer<typeof CreateCatatanKlinisSchema>;

// --- Entitas 2: Pengingat Kontrol ------------------------------------------
export const PengingatKontrolSchema = z.object({
  id: z.string(),
  patientId: z.string().min(1),
  tanggalKontrol: z.string().min(1, "Tanggal kontrol wajib diisi"),
  jenisPemeriksaan: z.enum(["ANC Rutin", "Cek Tensi Ulang", "USG", "Lab Darah/Urine"]),
  status: z.enum(["Belum Dikirim", "Terkirim"]),
});
export const CreatePengingatKontrolSchema = PengingatKontrolSchema.omit({
  id: true,
  status: true,
});

export type PengingatKontrol = z.infer<typeof PengingatKontrolSchema>;
export type CreatePengingatKontrolInput = z.infer<typeof CreatePengingatKontrolSchema>;

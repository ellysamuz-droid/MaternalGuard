import { z } from "zod";

// ---------------------------------------------------------------------------
// Skema Zod untuk 2 entitas Server State baru (Modul 7):
//   1) FollowUpNote — catatan tindak lanjut per pasien
//   2) Reminder     — pengingat jadwal kontrol per pasien
// Skema ini dipakai DUA arah, sama seperti pola `taskApi.ts` di modul:
//   - memvalidasi respons REST API sebelum masuk ke cache TanStack Query
//     (lib/client-api/followupApi.ts), dan
//   - memvalidasi payload sebelum dikirim lewat useMutation.
// ---------------------------------------------------------------------------

export const FollowUpNoteSchema = z.object({
  id: z.string(),
  patientId: z.string().min(1),
  note: z.string().trim().min(3, "Catatan minimal 3 karakter"),
  status: z.enum(["Pending", "Selesai"]),
  createdAt: z.string(),
});
export const CreateFollowUpNoteSchema = FollowUpNoteSchema.pick({
  patientId: true,
  note: true,
});

export type FollowUpNote = z.infer<typeof FollowUpNoteSchema>;
export type CreateFollowUpNoteInput = z.infer<typeof CreateFollowUpNoteSchema>;

export const ReminderSchema = z.object({
  id: z.string(),
  patientId: z.string().min(1),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  jenisPemeriksaan: z.enum(["Kontrol rutin", "USG", "Lab darah/urine", "Rujuk spesialis"]),
  terkirim: z.boolean(),
  createdAt: z.string(),
});
export const CreateReminderSchema = ReminderSchema.pick({
  patientId: true,
  tanggal: true,
  jenisPemeriksaan: true,
});

export type Reminder = z.infer<typeof ReminderSchema>;
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;

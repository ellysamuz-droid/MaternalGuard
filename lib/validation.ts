import { z } from "zod";

// Skema untuk form login (dipakai oleh Client Component LoginForm sebelum
// memanggil Server Action, sesuai poin (c) — Isolasi Komponen Klien & Zod).
export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Skema untuk form registrasi Ibu Hamil (FR-01).
export const registerSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter."),
  email: z.string().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  patientId: z.string().min(1, "Pilih data kehamilan yang sesuai."),
  puskesmas: z.string().min(1),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// Skema untuk form "Catat Hasil Periksa" (FR-04 / FR-05 pada SRS), memvalidasi
// rentang fisiologis nilai tekanan darah / nadi / berat badan sebelum dikirim
// ke Server Action `submitExamAction`.
export const examSchema = z
  .object({
    patientId: z.string().min(1),
    tanggal: z.string().min(1, "Tanggal wajib diisi."),
    jam: z.string().min(1, "Jam wajib diisi."),
    sistolik: z.coerce
      .number({ invalid_type_error: "Sistolik wajib diisi." })
      .min(60, "Nilai sistolik di luar rentang wajar (60–260 mmHg).")
      .max(260, "Nilai sistolik di luar rentang wajar (60–260 mmHg)."),
    diastolik: z.coerce
      .number({ invalid_type_error: "Diastolik wajib diisi." })
      .min(30, "Nilai diastolik di luar rentang wajar (30–180 mmHg).")
      .max(180, "Nilai diastolik di luar rentang wajar (30–180 mmHg)."),
    nadi: z.union([z.coerce.number().min(30).max(220), z.literal("")]).optional(),
    berat: z
      .union([z.coerce.number().positive("Berat badan harus lebih dari 0."), z.literal("")])
      .optional(),
    catatan: z.string().trim().min(1, "Catatan pemeriksaan tidak boleh kosong."),
    diagnosis: z.string().min(1),
    tindakLanjut: z.enum(["kontrol", "rujuk", "monitor"]),
    instruksi: z.string().optional().default(""),
    temuan: z.record(z.boolean()).default({}),
  })
  .refine((v) => v.diastolik < v.sistolik, {
    message: "Diastolik harus lebih kecil dari sistolik.",
    path: ["diastolik"],
  });
export type ExamInput = z.infer<typeof examSchema>;

// Field-level error map bertipe agar mudah dipetakan ke <Field error={...}>.
export type FieldErrors = Record<string, string>;

export function zodIssuesToFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

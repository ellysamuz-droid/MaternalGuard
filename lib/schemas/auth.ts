import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const registerSchema = z
  .object({
    nama: z.string().trim().min(3, "Nama minimal 3 karakter."),
    email: z.string().trim().min(1, "Email wajib diisi.").email("Format email tidak valid."),
    no_hp: z
      .string()
      .trim()
      .min(1, "Nomor HP wajib diisi.")
      .transform((v) => v.replace(/[^\d]/g, ""))
      .refine((v) => /^(62|0)8\d{8,12}$/.test(v), "Nomor HP tidak valid. Contoh: 081234567890."),
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter.")
      .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Gunakan kombinasi huruf dan angka."),
    konfirmasi: z.string(),
    setuju: z.literal(true, {
      errorMap: () => ({ message: "Centang pernyataan ini untuk melanjutkan." }),
    }),
  })
  .refine((v) => v.password === v.konfirmasi, {
    path: ["konfirmasi"],
    message: "Konfirmasi kata sandi tidak sama.",
  });

export type FieldErrors = Record<string, string>;

export function zodToFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

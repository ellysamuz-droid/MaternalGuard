import { z } from "zod";
import { hariIni, hitungUsia, isNoWaValid, normalisasiNoWa } from "../format";

// FR-02: form pendaftaran dan ubah data ibu hamil.
export const ibuHamilSchema = z
  .object({
    nama: z.string().trim().min(3, "Nama minimal 3 karakter."),
    no_wa: z
      .string()
      .trim()
      .min(1, "Nomor WhatsApp wajib diisi.")
      .transform(normalisasiNoWa)
      .refine(isNoWaValid, "Nomor WhatsApp tidak valid. Contoh: 081234567890 atau 6281234567890."),
    tanggal_lahir: z.string().min(1, "Tanggal lahir wajib diisi."),
    alamat: z.string().trim().min(5, "Alamat minimal 5 karakter."),
    hpht: z.string().min(1, "HPHT wajib diisi."),
    riwayat_status: z.enum(["tidak", "pernah"]),
    riwayat_detail: z.string().trim().max(300).default(""),
    riwayat_lain: z.string().trim().max(500).default(""),
    persetujuan_wa: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const usia = hitungUsia(v.tanggal_lahir);
    if (Number.isNaN(usia) || usia < 12 || usia > 55) {
      ctx.addIssue({
        code: "custom",
        path: ["tanggal_lahir"],
        message: "Usia harus antara 12 dan 55 tahun.",
      });
    }
    const hpht = new Date(`${v.hpht}T00:00:00`);
    const hari = (Date.now() - hpht.getTime()) / 86_400_000;
    if (v.hpht > hariIni()) {
      ctx.addIssue({ code: "custom", path: ["hpht"], message: "HPHT tidak boleh di masa depan." });
    } else if (hari > 300) {
      ctx.addIssue({
        code: "custom",
        path: ["hpht"],
        message: "HPHT lebih dari 300 hari lalu, periksa kembali.",
      });
    }
    if (v.riwayat_status === "pernah" && !v.riwayat_detail) {
      ctx.addIssue({
        code: "custom",
        path: ["riwayat_detail"],
        message: "Jelaskan singkat riwayat preeklamsia.",
      });
    }
  });

export type IbuHamilInput = z.infer<typeof ibuHamilSchema>;

export function toIbuPayload(v: IbuHamilInput) {
  return {
    nama: v.nama,
    no_wa: v.no_wa,
    tanggal_lahir: v.tanggal_lahir,
    alamat: v.alamat,
    hpht: v.hpht,
    riwayat_preeklamsia:
      v.riwayat_status === "pernah" ? `Pernah: ${v.riwayat_detail}` : "Tidak ada",
    riwayat_lain: v.riwayat_lain,
    persetujuan_wa: v.persetujuan_wa,
  };
}

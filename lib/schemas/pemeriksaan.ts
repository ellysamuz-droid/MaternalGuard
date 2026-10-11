import { z } from "zod";
import { hariIni } from "../format";

const angka = (label: string, min: number, max: number, satuan: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} wajib diisi.` })
    .min(min, `${label} di luar rentang wajar (${min}\u2013${max} ${satuan}).`)
    .max(max, `${label} di luar rentang wajar (${min}\u2013${max} ${satuan}).`);

// FR-05. Satuan form: suhu \u00b0C dan gula darah mg/dL. Konversi ke satuan model
// (\u00b0F dan mmol/L) dilakukan backend (Bagian 6.2), satuan dikirim bersama nilainya.
export const pemeriksaanSchema = z
  .object({
    sistolik: angka("Sistolik", 60, 260, "mmHg"),
    diastolik: angka("Diastolik", 30, 180, "mmHg"),
    nadi: z.preprocess(
      (v) => (v === "" || v == null ? null : v),
      angka("Nadi", 30, 220, "x/menit").nullable(),
    ),
    suhu: angka("Suhu", 33, 43, "\u00b0C"),
    gula_darah: angka("Gula darah", 20, 600, "mg/dL"),
    berat_badan: angka("Berat badan", 30, 200, "kg"),
    id_jenis_keluhan: z.array(z.coerce.number().int().positive()).default([]),
    keluhan_lain: z.string().trim().max(500, "Maksimal 500 karakter.").default(""),
    tanggal_kontrol_berikutnya: z.string().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.diastolik >= v.sistolik) {
      ctx.addIssue({
        code: "custom",
        path: ["diastolik"],
        message: "Diastolik harus lebih kecil dari sistolik.",
      });
    }
    if (v.tanggal_kontrol_berikutnya && v.tanggal_kontrol_berikutnya < hariIni()) {
      ctx.addIssue({
        code: "custom",
        path: ["tanggal_kontrol_berikutnya"],
        message: "Tanggal kontrol tidak boleh sebelum hari ini.",
      });
    }
  });

export type PemeriksaanInput = z.infer<typeof pemeriksaanSchema>;

export function toPemeriksaanPayload(v: PemeriksaanInput) {
  return {
    vital: {
      sistolik: v.sistolik,
      diastolik: v.diastolik,
      nadi: v.nadi,
      suhu: v.suhu,
      suhu_satuan: "C",
      gula_darah: v.gula_darah,
      gula_darah_satuan: "mg/dL",
      berat_badan: v.berat_badan,
    },
    id_jenis_keluhan: v.id_jenis_keluhan,
    keluhan_lain: v.keluhan_lain,
    tanggal_kontrol_berikutnya: v.tanggal_kontrol_berikutnya || null,
  };
}

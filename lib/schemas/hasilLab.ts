import { z } from "zod";
import { hariIni } from "../format";

export const DIPSTIK_OPSI = ["negatif", "trace", "+1", "+2", "+3", "+4"] as const;

const opsional = (label: string, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce
      .number({ invalid_type_error: `${label} harus berupa angka.` })
      .min(0, `${label} tidak boleh negatif.`)
      .max(max, `${label} terlalu besar, periksa kembali.`)
      .nullable(),
  );

// FR-06: status proteinuria positif ditentukan backend (ambang dapat dikonfigurasi).
export const hasilLabSchema = z.object({
  tanggal_lab: z
    .string()
    .min(1, "Tanggal lab wajib diisi.")
    .refine((v) => v <= hariIni(), "Tanggal lab tidak boleh di masa depan."),
  protein_dipstik: z.enum(DIPSTIK_OPSI, { errorMap: () => ({ message: "Pilih hasil dipstik." }) }),
  protein_24jam: opsional("Protein 24 jam", 50),
  rasio_protein_kreatinin: opsional("Rasio protein/kreatinin", 50),
  catatan: z.string().trim().max(500, "Maksimal 500 karakter.").default(""),
});

export type HasilLabInput = z.infer<typeof hasilLabSchema>;

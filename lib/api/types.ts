// Tipe data mengikuti ERD & class diagram pada dokumen Analisis Arsitektur v2.0.
// Bentuk JSON respons API belum didefinisikan dokumen; di sini diasumsikan
// sama dengan nama kolom pada ERD (lihat docs/Perubahan_Frontend_v2.md).

export const KATEGORI_RISIKO = ["low risk", "mid risk", "high risk"] as const;
export type KategoriRisiko = (typeof KATEGORI_RISIKO)[number];

export type StatusPersalinan = "belum lahir" | "sudah lahir";
export type StatusKirim = "menunggu" | "terkirim" | "diterima" | "gagal";
export type StatusJadwal = "aktif" | "dijeda" | "berhenti";

export interface Bidan {
  id_bidan: number;
  nama: string;
  email: string;
  no_hp: string;
}

export interface IbuHamil {
  id_ibu: number;
  id_bidan: number;
  nama: string;
  no_wa: string;
  tanggal_lahir: string; // yyyy-mm-dd
  alamat: string;
  hpht: string; // yyyy-mm-dd
  riwayat_preeklamsia: string;
  riwayat_lain: string;
  status_risiko: KategoriRisiko | null; // null = belum ada pemeriksaan
  persetujuan_wa: boolean;
  status_persalinan: StatusPersalinan;
  tanggal_persalinan: string | null;
}

export interface JenisKeluhan {
  id_jenis_keluhan: number;
  nama_keluhan: string;
  tanda_bahaya: boolean;
}

export interface Vital {
  id_vital: number;
  sistolik: number;
  diastolik: number;
  nadi: number | null;
  suhu: number; // derajat Celsius
  gula_darah: number; // mg/dL
  berat_badan: number; // kg
}

export interface SkorRisiko {
  id_skor: number;
  id_pemeriksaan: number;
  kategori: KategoriRisiko;
  tanggal_prediksi: string;
}

export interface Pemeriksaan {
  id_pemeriksaan: number;
  id_ibu: number;
  id_bidan: number;
  tanggal_pemeriksaan: string; // ISO datetime
  keluhan_lain: string;
  tanggal_kontrol_berikutnya: string | null;
  vital: Vital;
  keluhan: JenisKeluhan[]; // hasil join detail_keluhan
  skor: SkorRisiko | null; // null jika skoring gagal
}

export interface HasilLab {
  id_lab: number;
  id_ibu: number;
  id_bidan: number;
  tanggal_lab: string;
  protein_dipstik: string;
  protein_24jam: number | null;
  rasio_protein_kreatinin: number | null;
  catatan: string;
  proteinuria_positif: boolean; // atribut turunan, dihitung backend
}

export interface JadwalPesan {
  id_jadwal: number;
  id_ibu: number;
  id_skor: number | null;
  status: StatusJadwal;
  frekuensi: string;
  hari_kirim: string;
  jam_kirim: string;
  tanggal_mulai: string;
  tanggal_berhenti: string | null;
  kirim_berikutnya: string | null;
}

export interface RiwayatNotifikasi {
  id_notifikasi: number;
  id_jadwal: number;
  id_template: number;
  isi_pesan: string;
  waktu_kirim: string;
  status_kirim: StatusKirim;
  no_wa_tujuan: string;
  id_pesan_gateway: string | null;
}

/** Respons POST /ibu-hamil/{id}/pemeriksaan (FR-05, 07, 08). */
export interface HasilPencatatan {
  pemeriksaan: Pemeriksaan;
  pesan_whatsapp: {
    dikirim: boolean;
    /** Alasan bila tidak dikirim (mis. persetujuan WA belum aktif). */
    alasan: string | null;
  };
  jadwal: JadwalPesan | null;
}

export interface LoginResult {
  access_token: string;
  token_type: string;
  bidan: Pick<Bidan, "id_bidan" | "nama">;
}

export interface Session {
  idBidan: number;
  nama: string;
}

import type {
  HasilLab,
  IbuHamil,
  JadwalPesan,
  JenisKeluhan,
  KategoriRisiko,
  Pemeriksaan,
  RiwayatNotifikasi,
  SkorRisiko,
  StatusKirim,
} from "../types";

// ---------------------------------------------------------------------------
// Database tiruan di memori untuk API_MODE=mock. Bentuknya mengikuti ERD v2.0.
// Seluruh data hanyalah contoh demo dan hilang saat server dimulai ulang.
// ---------------------------------------------------------------------------

export const BIDAN_DEMO = {
  id_bidan: 1,
  nama: "Bidan Siti Aminah",
  email: "bidan@maternalguard.id",
  password: "puskesmas123",
  no_hp: "081234567890",
};

export interface TemplatePesan {
  id_template: number;
  jenis_pesan: string;
  isi_template: string;
  kategori_risiko: KategoriRisiko;
}

const PENUTUP = " Jika tidak ingin menerima pesan ini, beri tahu Bidan {bidan}.";

// Contoh isi dari Bagian 6.4 dokumen. Template "pembuka" adalah contoh buatan
// untuk demo dan harus ditinjau bidan/tenaga medis sebelum dipakai sungguhan.
export const TEMPLATES: TemplatePesan[] = [
  {
    id_template: 1,
    jenis_pesan: "pembuka",
    kategori_risiko: "high risk",
    isi_template: `Halo Bu {nama}, ini pesan dari Bidan {bidan}. Mohon Ibu datang ke tempat saya dalam waktu dekat untuk pemeriksaan kehamilan ya, Bu. Jika ada pertanyaan, hubungi saya di {no_hp_bidan}.${PENUTUP}`,
  },
  {
    id_template: 2,
    jenis_pesan: "kontrol",
    kategori_risiko: "high risk",
    isi_template: `Halo Bu {nama}, ini pesan dari Bidan {bidan}. Mohon tetap datang kontrol sesuai jadwal ya, Bu. Jika ada pertanyaan, hubungi saya di {no_hp_bidan}.${PENUTUP}`,
  },
  {
    id_template: 3,
    jenis_pesan: "istirahat dan pola hidup",
    kategori_risiko: "high risk",
    isi_template: `Halo Bu {nama}. Usahakan istirahat cukup, tidur miring ke kiri, makan teratur, dan minum air putih yang cukup. Jika tidak ada keluhan, lanjutkan aktivitas seperti biasa. Salam, Bidan {bidan}.${PENUTUP}`,
  },
  {
    id_template: 4,
    jenis_pesan: "kenali tanda",
    kategori_risiko: "high risk",
    isi_template: `Halo Bu {nama}. Jika Ibu merasakan sakit kepala yang tidak hilang, pandangan kabur, nyeri ulu hati, bengkak mendadak, atau gerakan bayi berkurang, segera hubungi Bidan {bidan} di {no_hp_bidan} atau datang ke fasilitas kesehatan. Jika tidak ada keluhan seperti itu, tidak perlu khawatir.${PENUTUP}`,
  },
  {
    id_template: 5,
    jenis_pesan: "tanya kabar",
    kategori_risiko: "high risk",
    isi_template: `Halo Bu {nama}, semoga Ibu dan si kecil sehat hari ini. Jika ada yang ingin ditanyakan, silakan hubungi Bidan {bidan} di {no_hp_bidan}.${PENUTUP}`,
  },
];

export const JENIS_KELUHAN: JenisKeluhan[] = [
  { id_jenis_keluhan: 1, nama_keluhan: "Sakit kepala yang tidak hilang", tanda_bahaya: true },
  { id_jenis_keluhan: 2, nama_keluhan: "Pandangan kabur", tanda_bahaya: true },
  { id_jenis_keluhan: 3, nama_keluhan: "Nyeri ulu hati", tanda_bahaya: true },
  { id_jenis_keluhan: 4, nama_keluhan: "Bengkak mendadak (wajah atau tangan)", tanda_bahaya: true },
  { id_jenis_keluhan: 5, nama_keluhan: "Gerakan bayi berkurang", tanda_bahaya: true },
  { id_jenis_keluhan: 6, nama_keluhan: "Sesak napas", tanda_bahaya: true },
  { id_jenis_keluhan: 7, nama_keluhan: "Mual muntah berlebihan", tanda_bahaya: false },
  { id_jenis_keluhan: 8, nama_keluhan: "Kaki bengkak ringan", tanda_bahaya: false },
  { id_jenis_keluhan: 9, nama_keluhan: "Pusing ringan", tanda_bahaya: false },
];

export interface BidanMock {
  id_bidan: number;
  nama: string;
  email: string;
  password: string; // hanya mock; backend nyata menyimpan hash bcrypt
  no_hp: string;
}

interface Store {
  bidan: BidanMock[];
  ibu: IbuHamil[];
  pemeriksaan: Pemeriksaan[];
  lab: HasilLab[];
  jadwal: JadwalPesan[];
  notif: (RiwayatNotifikasi & { dibuat_ms: number })[];
  seq: Record<string, number>;
  loginGagal: Record<string, { count: number; sejak: number }>;
}

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();
const tgl = (ms: number) => iso(ms).slice(0, 10);

/** Hari kirim tetap Selasa & Jumat pukul 10.00 WIB, minimal `minHari` hari dari `fromMs`. */
export function hitungKirimBerikutnya(fromMs: number, minHari: number): string {
  const WIB = 7 * 3_600_000;
  const paling_cepat = fromMs + minHari * DAY;
  for (let i = 0; i < minHari + 9; i++) {
    const w = new Date(fromMs + i * DAY + WIB);
    const hari = w.getUTCDay();
    if (hari !== 2 && hari !== 5) continue;
    const kandidat = Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate(), 10) - WIB;
    if (kandidat >= paling_cepat) return iso(kandidat); // minimal `minHari` x 24 jam
  }
  return iso(paling_cepat);
}

function createStore(): Store {
  const now = Date.now();
  const s: Store = {
    bidan: [{ ...BIDAN_DEMO }],
    ibu: [],
    pemeriksaan: [],
    lab: [],
    jadwal: [],
    notif: [],
    seq: { bidan: 1, ibu: 0, pemeriksaan: 0, vital: 0, skor: 0, lab: 0, jadwal: 0, notif: 0 },
    loginGagal: {},
  };
  const next = (k: string) => {
    s.seq[k] = (s.seq[k] ?? 0) + 1;
    return s.seq[k] as number;
  };

  const addIbu = (
    p: Pick<IbuHamil, "nama" | "no_wa" | "tanggal_lahir" | "alamat"> &
      Partial<IbuHamil> & { hphtHariLalu: number },
  ) => {
    const id = next("ibu");
    s.ibu.push({
      id_ibu: id,
      id_bidan: p.id_bidan ?? 1,
      nama: p.nama,
      no_wa: p.no_wa,
      tanggal_lahir: p.tanggal_lahir,
      alamat: p.alamat,
      hpht: tgl(now - p.hphtHariLalu * DAY),
      riwayat_preeklamsia: p.riwayat_preeklamsia ?? "Tidak ada",
      riwayat_lain: p.riwayat_lain ?? "",
      status_risiko: null,
      persetujuan_wa: p.persetujuan_wa ?? true,
      status_persalinan: p.status_persalinan ?? "belum lahir",
      tanggal_persalinan: p.tanggal_persalinan ?? null,
    });
    return id;
  };

  const addPemeriksaan = (
    idIbu: number,
    hariLalu: number,
    sis: number,
    dia: number,
    nadi: number | null,
    suhu: number,
    gd: number,
    bb: number,
    keluhanIds: number[],
    kategori: KategoriRisiko,
    kontrolHari: number | null,
  ) => {
    const idp = next("pemeriksaan");
    const ids = next("skor");
    const waktu = iso(now - hariLalu * DAY);
    const skor: SkorRisiko = {
      id_skor: ids,
      id_pemeriksaan: idp,
      kategori,
      tanggal_prediksi: waktu,
    };
    s.pemeriksaan.push({
      id_pemeriksaan: idp,
      id_ibu: idIbu,
      id_bidan: 1,
      tanggal_pemeriksaan: waktu,
      keluhan_lain: "",
      tanggal_kontrol_berikutnya: kontrolHari === null ? null : tgl(now + kontrolHari * DAY),
      vital: {
        id_vital: next("vital"),
        sistolik: sis,
        diastolik: dia,
        nadi,
        suhu,
        gula_darah: gd,
        berat_badan: bb,
      },
      keluhan: JENIS_KELUHAN.filter((k) => keluhanIds.includes(k.id_jenis_keluhan)),
      skor,
    });
    const ibu = s.ibu.find((i) => i.id_ibu === idIbu);
    if (ibu) ibu.status_risiko = kategori;
    return ids;
  };

  const addLab = (
    idIbu: number,
    hariLalu: number,
    dipstik: string,
    p24: number | null,
    rpk: number | null,
    positif: boolean,
    catatan = "",
  ) => {
    s.lab.push({
      id_lab: next("lab"),
      id_ibu: idIbu,
      id_bidan: 1,
      tanggal_lab: tgl(now - hariLalu * DAY),
      protein_dipstik: dipstik,
      protein_24jam: p24,
      rasio_protein_kreatinin: rpk,
      catatan,
      proteinuria_positif: positif,
    });
  };

  const addNotif = (
    idJadwal: number,
    idTemplate: number,
    hariLalu: number,
    status: StatusKirim,
    ibuId: number,
  ) => {
    const t = TEMPLATES.find((x) => x.id_template === idTemplate);
    const ibu = s.ibu.find((i) => i.id_ibu === ibuId);
    if (!t || !ibu) return;
    const idn = next("notif");
    s.notif.push({
      id_notifikasi: idn,
      id_jadwal: idJadwal,
      id_template: idTemplate,
      isi_pesan: isiPesan(t.isi_template, ibu.nama, BIDAN_DEMO),
      waktu_kirim: iso(now - hariLalu * DAY),
      status_kirim: status,
      no_wa_tujuan: ibu.no_wa,
      id_pesan_gateway: `wamid.demo${idn}`,
      dibuat_ms: now - hariLalu * DAY,
    });
  };

  // 1. Siti Rahma — high risk, jadwal aktif
  const a = addIbu({
    nama: "Siti Rahma",
    no_wa: "6281234500001",
    tanggal_lahir: "1997-04-12",
    alamat: "Jl. Melati No. 4, Tegal",
    hphtHariLalu: 224,
  });
  addLab(a, 9, "+2", null, null, true, "Urine pagi hari");
  addPemeriksaan(a, 21, 118, 76, 80, 36.6, 92, 61, [], "low risk", 7);
  addPemeriksaan(a, 14, 132, 84, 82, 36.7, 95, 62, [9], "mid risk", 7);
  addPemeriksaan(a, 7, 138, 88, 84, 36.8, 98, 63.5, [8], "mid risk", 7);
  addPemeriksaan(a, 1, 148, 96, 88, 36.9, 101, 64.5, [1, 2], "high risk", 6);
  const j1 = next("jadwal");
  s.jadwal.push({
    id_jadwal: j1,
    id_ibu: a,
    id_skor: 4,
    status: "aktif",
    frekuensi: "2x per minggu",
    hari_kirim: "Selasa, Jumat",
    jam_kirim: "10:00",
    tanggal_mulai: tgl(now - DAY),
    tanggal_berhenti: null,
    kirim_berikutnya: hitungKirimBerikutnya(now, 2),
  });
  addNotif(j1, 1, 1, "diterima", a);

  // 2. Dewi Lestari — mid risk
  const b = addIbu({
    nama: "Dewi Lestari",
    no_wa: "6281234500002",
    tanggal_lahir: "1999-09-30",
    alamat: "Jl. Kenanga No. 12, Slawi",
    hphtHariLalu: 196,
  });
  addPemeriksaan(b, 14, 124, 80, 78, 36.5, 88, 58, [], "low risk", 14);
  addPemeriksaan(b, 3, 134, 86, 80, 36.6, 90, 59, [9], "mid risk", 11);

  // 3. Ayu Putri — low risk
  const c = addIbu({
    nama: "Ayu Putri",
    no_wa: "6281234500003",
    tanggal_lahir: "2002-01-18",
    alamat: "Jl. Anggrek No. 7, Brebes",
    hphtHariLalu: 140,
  });
  addPemeriksaan(c, 10, 112, 72, 76, 36.4, 85, 54, [], "low risk", 18);

  // 4. Rina Marlina — low risk, riwayat preeklamsia
  const d = addIbu({
    nama: "Rina Marlina",
    no_wa: "6281234500004",
    tanggal_lahir: "1994-06-02",
    alamat: "Jl. Flamboyan No. 21, Tegal",
    hphtHariLalu: 168,
    riwayat_preeklamsia: "Pernah: kehamilan pertama (2021)",
    riwayat_lain: "Tidak ada",
  });
  addPemeriksaan(d, 5, 116, 74, 78, 36.5, 90, 62, [], "low risk", 9);

  // 5. Maya Sari — mid risk, belum setuju WA
  const e = addIbu({
    nama: "Maya Sari",
    no_wa: "6281234500005",
    tanggal_lahir: "1998-11-23",
    alamat: "Jl. Cempaka No. 3, Pemalang",
    hphtHariLalu: 210,
    persetujuan_wa: false,
  });
  addPemeriksaan(e, 4, 136, 88, 82, 36.7, 97, 66, [8], "mid risk", 10);

  // 6. Fitri Handayani — sudah lahir, jadwal berhenti
  const f = addIbu({
    nama: "Fitri Handayani",
    no_wa: "6281234500006",
    tanggal_lahir: "1996-03-09",
    alamat: "Jl. Mawar No. 15, Tegal",
    hphtHariLalu: 280,
    status_persalinan: "sudah lahir",
    tanggal_persalinan: tgl(now - 5 * DAY),
  });
  addLab(f, 40, "+1", 0.35, 0.32, true);
  addPemeriksaan(f, 30, 146, 94, 90, 36.8, 99, 70, [1], "high risk", 7);
  const j6 = next("jadwal");
  s.jadwal.push({
    id_jadwal: j6,
    id_ibu: f,
    id_skor: 0,
    status: "berhenti",
    frekuensi: "2x per minggu",
    hari_kirim: "Selasa, Jumat",
    jam_kirim: "10:00",
    tanggal_mulai: tgl(now - 29 * DAY),
    tanggal_berhenti: tgl(now - 5 * DAY),
    kirim_berikutnya: null,
  });
  addNotif(j6, 1, 29, "diterima", f);
  addNotif(j6, 2, 25, "diterima", f);
  addNotif(j6, 3, 22, "terkirim", f);
  addNotif(j6, 4, 18, "gagal", f);

  // 7. Ibu milik bidan lain — dipakai untuk menguji pembatasan akses (id_bidan)
  addIbu({
    id_bidan: 2,
    nama: "Nurul Aini",
    no_wa: "6281234500007",
    tanggal_lahir: "1995-08-08",
    alamat: "Kota lain",
    hphtHariLalu: 100,
  });

  return s;
}

const g = globalThis as unknown as { __mgMock?: Store };
if (!g.__mgMock) g.__mgMock = createStore();
export const db: Store = g.__mgMock;

export function nextId(key: string): number {
  db.seq[key] = (db.seq[key] ?? 0) + 1;
  return db.seq[key] as number;
}

export function isiPesan(
  template: string,
  namaIbu: string,
  bidan: { nama: string; no_hp: string },
): string {
  return template
    .replaceAll("{nama}", namaIbu)
    .replaceAll("{bidan}", bidan.nama.replace(/^Bidan\s+/i, ""))
    .replaceAll("{no_hp_bidan}", bidan.no_hp);
}

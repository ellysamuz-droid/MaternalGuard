import { decodeJwtPayload, isTokenActive } from "@/lib/jwt";
import type {
  HasilLab,
  HasilPencatatan,
  IbuHamil,
  JadwalPesan,
  KategoriRisiko,
  Pemeriksaan,
  RiwayatNotifikasi,
} from "../types";
import {
  BIDAN_DEMO,
  db,
  hitungKirimBerikutnya,
  isiPesan,
  JENIS_KELUHAN,
  nextId,
  TEMPLATES,
} from "./db";

// ---------------------------------------------------------------------------
// Backend tiruan: meniru kontrak endpoint Bagian 9 dokumen (/api/v1) agar
// front end dapat dijalankan tanpa FastAPI. BUKAN implementasi backend:
//  - skoring di bawah hanyalah aturan sederhana untuk demo, bukan model .pkl;
//  - status pesan WhatsApp berubah menurut waktu untuk meniru webhook;
//  - jadwal pesan terjadwal tidak dikirim oleh worker (tidak ada worker).
// ---------------------------------------------------------------------------

export interface MockResponse {
  status: number;
  data: unknown;
}

const ok = (data: unknown, status = 200): MockResponse => ({ status, data });
const err = (status: number, detail: unknown): MockResponse => ({ status, data: { detail } });
const bodyErr = (field: string, msg: string): MockResponse =>
  err(422, [{ loc: ["body", field], msg }]);

const BATAS_LOGIN = 5;
const JENDELA_LOGIN_MS = 5 * 60_000;

function buatToken(idBidan: number, nama: string): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const menit = Number(process.env.MOCK_TOKEN_MINUTES ?? 120);
  const exp = Math.floor(Date.now() / 1000) + menit * 60;
  return `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: String(idBidan), nama, exp })}.mock`;
}

function skorDemo(
  ibu: IbuHamil,
  p: { sis: number; dia: number; tandaBahaya: boolean },
): KategoriRisiko {
  const pernah = ibu.riwayat_preeklamsia.toLowerCase().startsWith("pernah");
  if (p.sis >= 160 || p.dia >= 110 || ((p.sis >= 140 || p.dia >= 90) && p.tandaBahaya)) {
    return "high risk";
  }
  if (p.sis >= 140 || p.dia >= 90 || p.sis >= 130 || p.dia >= 85 || (pernah && p.sis >= 125)) {
    return "mid risk";
  }
  return "low risk";
}

/** Meniru webhook: status berubah menurut umur baris riwayat. */
function majukanStatus() {
  const now = Date.now();
  for (const n of db.notif) {
    const umur = now - n.dibuat_ms;
    if (n.status_kirim === "menunggu" && umur > 4000) n.status_kirim = "terkirim";
    if (n.status_kirim === "terkirim" && umur > 10_000) n.status_kirim = "diterima";
  }
}

const strip = <T extends { dibuat_ms?: number }>(n: T) => {
  const { dibuat_ms: _d, ...rest } = n;
  return rest;
};

export function handleMock(
  method: string,
  path: string,
  query: URLSearchParams,
  body: Record<string, unknown> | null,
  token: string | null,
): MockResponse {
  // --- tanpa token
  if (method === "GET" && path === "/health") return ok({ status: "ok", mode: "mock" });

  if (method === "POST" && path === "/auth/login") {
    const email = String(body?.email ?? "").toLowerCase();
    const password = String(body?.password ?? "");
    const rec = db.loginGagal[email];
    const now = Date.now();
    if (rec && now - rec.sejak < JENDELA_LOGIN_MS && rec.count >= BATAS_LOGIN) {
      return err(429, "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.");
    }
    if (email !== BIDAN_DEMO.email || password !== BIDAN_DEMO.password) {
      const fresh = rec && now - rec.sejak < JENDELA_LOGIN_MS ? rec : { count: 0, sejak: now };
      fresh.count += 1;
      db.loginGagal[email] = fresh;
      return err(401, "Email atau kata sandi salah.");
    }
    delete db.loginGagal[email];
    return ok({
      access_token: buatToken(BIDAN_DEMO.id_bidan, BIDAN_DEMO.nama),
      token_type: "bearer",
      bidan: { id_bidan: BIDAN_DEMO.id_bidan, nama: BIDAN_DEMO.nama },
    });
  }

  // --- wajib token
  if (!token || !isTokenActive(token)) return err(401, "Token tidak valid atau kedaluwarsa.");
  const idBidan = Number(decodeJwtPayload(token)?.sub);
  if (Number.isNaN(idBidan)) return err(401, "Token tidak valid.");

  if (method === "GET" && path === "/jenis-keluhan") return ok(JENIS_KELUHAN);

  const ibuMilik = (id: number) => db.ibu.find((i) => i.id_ibu === id && i.id_bidan === idBidan);

  // GET /ibu-hamil
  if (path === "/ibu-hamil" && method === "GET") {
    const cari = (query.get("cari") ?? "").trim().toLowerCase();
    const risiko = query.get("status_risiko") ?? "";
    const persalinan = query.get("status_persalinan") ?? "";
    const rows = db.ibu
      .filter((i) => i.id_bidan === idBidan)
      .filter((i) => !cari || i.nama.toLowerCase().includes(cari) || i.no_wa.includes(cari))
      .filter((i) => !risiko || i.status_risiko === risiko)
      .filter((i) => !persalinan || i.status_persalinan === persalinan);
    return ok(rows);
  }

  // POST /ibu-hamil
  if (path === "/ibu-hamil" && method === "POST") {
    const v = validasiIbu(body);
    if ("res" in v) return v.res;
    const ibu: IbuHamil = {
      id_ibu: nextId("ibu"),
      id_bidan: idBidan,
      ...v.data,
      status_risiko: null,
      status_persalinan: "belum lahir",
      tanggal_persalinan: null,
    };
    db.ibu.push(ibu);
    return ok(ibu, 201);
  }

  const mIbu = path.match(/^\/ibu-hamil\/(\d+)(\/[a-z-]+)?$/);
  if (mIbu) {
    const id = Number(mIbu[1]);
    const sub = mIbu[2] ?? "";
    const ibu = ibuMilik(id);
    if (!ibu) return err(404, "Ibu hamil tidak ditemukan.");

    if (sub === "" && method === "GET") return ok(ibu);

    if (sub === "" && method === "PUT") {
      const v = validasiIbu(body);
      if ("res" in v) return v.res;
      const cabut = ibu.persetujuan_wa && !v.data.persetujuan_wa;
      Object.assign(ibu, v.data);
      // Persetujuan dicabut: jadwal berhenti (Bagian 6.3 butir 4).
      if (cabut) hentikanJadwal(ibu.id_ibu);
      return ok(ibu);
    }

    if (sub === "/status-persalinan" && method === "PATCH") {
      const st = body?.status_persalinan;
      if (st !== "belum lahir" && st !== "sudah lahir") {
        return bodyErr("status_persalinan", "Nilai harus 'belum lahir' atau 'sudah lahir'.");
      }
      if (st === "sudah lahir") {
        const t = String(body?.tanggal_persalinan ?? "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(t))
          return bodyErr("tanggal_persalinan", "Tanggal persalinan wajib diisi.");
        ibu.tanggal_persalinan = t;
        hentikanJadwal(ibu.id_ibu); // satu transaksi: status + penghentian jadwal
      } else {
        ibu.tanggal_persalinan = null;
      }
      ibu.status_persalinan = st;
      return ok(ibu);
    }

    if (sub === "/pemeriksaan" && method === "GET") {
      const rows = db.pemeriksaan
        .filter((p) => p.id_ibu === id)
        .sort((a, b) => b.tanggal_pemeriksaan.localeCompare(a.tanggal_pemeriksaan));
      return ok(rows);
    }

    if (sub === "/pemeriksaan" && method === "POST") return catatPemeriksaan(ibu, body);

    if (sub === "/hasil-lab" && method === "GET") {
      return ok(
        db.lab
          .filter((l) => l.id_ibu === id)
          .sort((a, b) => b.tanggal_lab.localeCompare(a.tanggal_lab)),
      );
    }

    if (sub === "/hasil-lab" && method === "POST") {
      const dip = String(body?.protein_dipstik ?? "");
      if (!["negatif", "trace", "+1", "+2", "+3", "+4"].includes(dip)) {
        return bodyErr("protein_dipstik", "Pilih hasil dipstik.");
      }
      const p24 = body?.protein_24jam == null ? null : Number(body.protein_24jam);
      const rpk =
        body?.rasio_protein_kreatinin == null ? null : Number(body.rasio_protein_kreatinin);
      const tanggal = String(body?.tanggal_lab ?? "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal))
        return bodyErr("tanggal_lab", "Tanggal lab wajib diisi.");
      // Ambang demo; di backend nyata dapat dikonfigurasi (Bagian 6.3 butir 8).
      const positif =
        ["+1", "+2", "+3", "+4"].includes(dip) ||
        (p24 !== null && p24 >= 0.3) ||
        (rpk !== null && rpk >= 0.3);
      const lab: HasilLab = {
        id_lab: nextId("lab"),
        id_ibu: id,
        id_bidan: idBidan,
        tanggal_lab: tanggal,
        protein_dipstik: dip,
        protein_24jam: p24,
        rasio_protein_kreatinin: rpk,
        catatan: String(body?.catatan ?? ""),
        proteinuria_positif: positif,
      };
      db.lab.push(lab);
      return ok(lab, 201);
    }

    if (sub === "/notifikasi" && method === "GET") {
      majukanStatus();
      const idsJadwal = new Set(db.jadwal.filter((j) => j.id_ibu === id).map((j) => j.id_jadwal));
      const rows = db.notif
        .filter((n) => idsJadwal.has(n.id_jadwal))
        .sort((a, b) => b.waktu_kirim.localeCompare(a.waktu_kirim))
        .map(strip);
      return ok(rows);
    }

    if (sub === "/jadwal-pesan" && method === "GET") {
      return ok(db.jadwal.filter((j) => j.id_ibu === id).sort((a, b) => b.id_jadwal - a.id_jadwal));
    }
  }

  // PATCH /jadwal-pesan/{id}
  const mJ = path.match(/^\/jadwal-pesan\/(\d+)$/);
  if (mJ && method === "PATCH") {
    const j = db.jadwal.find((x) => x.id_jadwal === Number(mJ[1]));
    if (!j || !ibuMilik(j.id_ibu)) return err(404, "Jadwal pesan tidak ditemukan.");
    const st = body?.status;
    if (st !== "aktif" && st !== "dijeda")
      return bodyErr("status", "Nilai harus 'aktif' atau 'dijeda'.");
    if (j.status === "berhenti")
      return err(409, "Jadwal sudah berhenti dan tidak dapat diaktifkan kembali.");
    const ibu = ibuMilik(j.id_ibu);
    if (st === "aktif" && ibu) {
      if (ibu.status_persalinan === "sudah lahir")
        return err(409, "Ibu sudah lahir, jadwal tidak dapat diaktifkan.");
      if (!ibu.persetujuan_wa) return err(409, "Persetujuan WhatsApp ibu belum aktif.");
      j.kirim_berikutnya = hitungKirimBerikutnya(Date.now(), 1);
    }
    j.status = st;
    return ok(j);
  }

  return err(404, `Endpoint tidak ditemukan: ${method} ${path}`);
}

function hentikanJadwal(idIbu: number) {
  for (const j of db.jadwal) {
    if (j.id_ibu === idIbu && j.status !== "berhenti") {
      j.status = "berhenti";
      j.tanggal_berhenti = new Date().toISOString().slice(0, 10);
      j.kirim_berikutnya = null;
    }
  }
}

function validasiIbu(b: Record<string, unknown> | null):
  | {
      data: Pick<
        IbuHamil,
        | "nama"
        | "no_wa"
        | "tanggal_lahir"
        | "alamat"
        | "hpht"
        | "riwayat_preeklamsia"
        | "riwayat_lain"
        | "persetujuan_wa"
      >;
    }
  | { res: MockResponse } {
  const str = (k: string) => String(b?.[k] ?? "").trim();
  if (str("nama").length < 3) return { res: bodyErr("nama", "Nama minimal 3 karakter.") };
  if (!/^62\d{8,13}$/.test(str("no_wa")))
    return { res: bodyErr("no_wa", "Nomor WhatsApp harus berformat 62xxxxxxxxxx.") };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str("tanggal_lahir")))
    return { res: bodyErr("tanggal_lahir", "Tanggal lahir wajib diisi.") };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str("hpht")))
    return { res: bodyErr("hpht", "HPHT wajib diisi.") };
  if (!str("alamat")) return { res: bodyErr("alamat", "Alamat wajib diisi.") };
  return {
    data: {
      nama: str("nama"),
      no_wa: str("no_wa"),
      tanggal_lahir: str("tanggal_lahir"),
      alamat: str("alamat"),
      hpht: str("hpht"),
      riwayat_preeklamsia: str("riwayat_preeklamsia") || "Tidak ada",
      riwayat_lain: str("riwayat_lain"),
      persetujuan_wa: b?.persetujuan_wa === true,
    },
  };
}

function catatPemeriksaan(ibu: IbuHamil, b: Record<string, unknown> | null): MockResponse {
  const v = (b?.vital ?? {}) as Record<string, unknown>;
  const num = (x: unknown) => (x === null || x === undefined || x === "" ? null : Number(x));
  const sis = num(v.sistolik);
  const dia = num(v.diastolik);
  const suhu = num(v.suhu);
  const gd = num(v.gula_darah);
  const bb = num(v.berat_badan);
  if (sis === null || Number.isNaN(sis)) return bodyErr("sistolik", "Sistolik wajib diisi.");
  if (dia === null || Number.isNaN(dia)) return bodyErr("diastolik", "Diastolik wajib diisi.");
  if (dia >= sis) return bodyErr("diastolik", "Diastolik harus lebih kecil dari sistolik.");
  if (suhu === null || gd === null || bb === null)
    return bodyErr("vital", "Suhu, gula darah, dan berat badan wajib diisi.");

  const idKel = Array.isArray(b?.id_jenis_keluhan) ? (b?.id_jenis_keluhan as number[]) : [];
  const keluhan = JENIS_KELUHAN.filter((k) => idKel.includes(k.id_jenis_keluhan));
  const waktu = new Date().toISOString();
  const idp = nextId("pemeriksaan");

  const kategori = skorDemo(ibu, { sis, dia, tandaBahaya: keluhan.some((k) => k.tanda_bahaya) });
  const skor = { id_skor: nextId("skor"), id_pemeriksaan: idp, kategori, tanggal_prediksi: waktu };
  const p: Pemeriksaan = {
    id_pemeriksaan: idp,
    id_ibu: ibu.id_ibu,
    id_bidan: ibu.id_bidan,
    tanggal_pemeriksaan: waktu,
    keluhan_lain: String(b?.keluhan_lain ?? ""),
    tanggal_kontrol_berikutnya: b?.tanggal_kontrol_berikutnya
      ? String(b.tanggal_kontrol_berikutnya)
      : null,
    vital: {
      id_vital: nextId("vital"),
      sistolik: sis,
      diastolik: dia,
      nadi: num(v.nadi),
      suhu,
      gula_darah: gd,
      berat_badan: bb,
    },
    keluhan,
    skor,
  };
  db.pemeriksaan.push(p);
  ibu.status_risiko = kategori;

  const hasil: HasilPencatatan = {
    pemeriksaan: p,
    pesan_whatsapp: { dikirim: false, alasan: null },
    jadwal: null,
  };
  const aktif = db.jadwal.find((j) => j.id_ibu === ibu.id_ibu && j.status !== "berhenti");

  if (kategori !== "high risk") {
    // Turunnya kategori ke low/mid menghentikan jadwal otomatis (Bagian 6.3 butir 3).
    if (aktif) hentikanJadwal(ibu.id_ibu);
    hasil.pesan_whatsapp.alasan = "Kategori bukan high risk, pesan WhatsApp tidak dikirim.";
    return ok(hasil, 201);
  }

  if (!ibu.persetujuan_wa) {
    hasil.pesan_whatsapp.alasan = "Persetujuan WhatsApp ibu belum aktif.";
    return ok(hasil, 201);
  }
  if (!/^62\d{8,13}$/.test(ibu.no_wa)) {
    hasil.pesan_whatsapp.alasan = "Nomor WhatsApp tidak valid.";
    return ok(hasil, 201);
  }
  if (ibu.status_persalinan === "sudah lahir") {
    hasil.pesan_whatsapp.alasan = "Ibu sudah melahirkan.";
    return ok(hasil, 201);
  }

  // Jadwal dibuat/diperbarui lebih dulu karena riwayat_notifikasi.id_jadwal adalah FK.
  let jadwal: JadwalPesan;
  if (aktif) {
    aktif.id_skor = skor.id_skor;
    jadwal = aktif;
  } else {
    jadwal = {
      id_jadwal: nextId("jadwal"),
      id_ibu: ibu.id_ibu,
      id_skor: skor.id_skor,
      status: "aktif",
      frekuensi: "2x per minggu",
      hari_kirim: "Selasa, Jumat",
      jam_kirim: "10:00",
      tanggal_mulai: waktu.slice(0, 10),
      tanggal_berhenti: null,
      kirim_berikutnya: hitungKirimBerikutnya(Date.now(), 2), // minimal 2 hari setelah pesan langsung
    };
    db.jadwal.push(jadwal);
  }
  hasil.jadwal = jadwal;

  if (jadwal.status === "dijeda") {
    hasil.pesan_whatsapp.alasan = "Jadwal pesan sedang dijeda oleh bidan.";
    return ok(hasil, 201);
  }

  const tpl = TEMPLATES[0];
  if (tpl) {
    const n: RiwayatNotifikasi & { dibuat_ms: number } = {
      id_notifikasi: nextId("notif"),
      id_jadwal: jadwal.id_jadwal,
      id_template: tpl.id_template,
      isi_pesan: isiPesan(tpl.isi_template, ibu.nama),
      waktu_kirim: waktu,
      status_kirim: "menunggu",
      no_wa_tujuan: ibu.no_wa,
      id_pesan_gateway: null,
      dibuat_ms: Date.now(),
    };
    db.notif.push(n);
  }
  hasil.pesan_whatsapp = { dikirim: true, alasan: null };
  return ok(hasil, 201);
}

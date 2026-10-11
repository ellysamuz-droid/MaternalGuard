"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { type FormState, simpanPemeriksaanAction } from "@/lib/actions";
import type { HasilPencatatan, IbuHamil, JenisKeluhan } from "@/lib/api/types";
import { formatTanggal, formatWaktu, hariIni } from "@/lib/format";
import { RiskBadge } from "../ui/Badges";
import Disclaimer from "../ui/Disclaimer";
import { Field, FormError, SubmitButton } from "../ui/FormBits";

const initial: FormState<HasilPencatatan> = { status: "idle" };

const PESAN_KATEGORI = {
  "high risk":
    "Tekanan darah dan data lain menunjukkan perlunya perhatian segera. Tinjau ibu secara langsung.",
  "mid risk": "Perlu dipantau lebih sering. Pertimbangkan kontrol ulang dalam waktu dekat.",
  "low risk": "Tidak ada tanda perlu perhatian khusus saat ini. Lanjutkan pemantauan rutin.",
} as const;

// FR-05: form pemeriksaan. Setelah tersimpan, layar hasil menampilkan kategori
// risiko dan status pesan WhatsApp (FR-07, FR-08). Dibungkus agar bisa "catat lagi".
export default function PemeriksaanFlow({
  ibu,
  jenisKeluhan,
}: {
  ibu: IbuHamil;
  jenisKeluhan: JenisKeluhan[];
}) {
  const [n, setN] = useState(0);
  return (
    <PemeriksaanForm key={n} ibu={ibu} jenisKeluhan={jenisKeluhan} onUlang={() => setN(n + 1)} />
  );
}

function PemeriksaanForm({
  ibu,
  jenisKeluhan,
  onUlang,
}: {
  ibu: IbuHamil;
  jenisKeluhan: JenisKeluhan[];
  onUlang: () => void;
}) {
  const [state, action] = useFormState(simpanPemeriksaanAction, initial);
  const fe = state.fieldErrors ?? {};
  const v = (k: string) => (state.values?.[k] as string | undefined) ?? "";
  const dipilih = new Set(
    ([] as string[]).concat(
      (state.values?.id_jenis_keluhan as string | string[] | undefined) ?? [],
    ),
  );
  const cls = (k: string) => `form-control ${fe[k] ? "is-invalid" : ""}`;

  if (state.status === "success" && state.data) {
    return <HasilCard hasil={state.data} ibu={ibu} onUlang={onUlang} />;
  }

  return (
    <form action={action} noValidate>
      <input type="hidden" name="id_ibu" value={ibu.id_ibu} />
      <FormError message={state.formError} />

      <div className="card mb-3">
        <div className="card-header">Tanda vital</div>
        <div className="card-body">
          <div className="row">
            <div className="col-6 col-md-3">
              <Field label="Sistolik" name="sistolik" error={fe.sistolik} required>
                <div className="input-group">
                  <input
                    id="sistolik"
                    name="sistolik"
                    inputMode="numeric"
                    className={cls("sistolik")}
                    defaultValue={v("sistolik")}
                    placeholder="120"
                  />
                  <span className="input-group-text">mmHg</span>
                </div>
              </Field>
            </div>
            <div className="col-6 col-md-3">
              <Field label="Diastolik" name="diastolik" error={fe.diastolik} required>
                <div className="input-group">
                  <input
                    id="diastolik"
                    name="diastolik"
                    inputMode="numeric"
                    className={cls("diastolik")}
                    defaultValue={v("diastolik")}
                    placeholder="80"
                  />
                  <span className="input-group-text">mmHg</span>
                </div>
              </Field>
            </div>
            <div className="col-6 col-md-3">
              <Field label="Nadi" name="nadi" error={fe.nadi} hint="Boleh dikosongkan.">
                <div className="input-group">
                  <input
                    id="nadi"
                    name="nadi"
                    inputMode="numeric"
                    className={cls("nadi")}
                    defaultValue={v("nadi")}
                    placeholder="80"
                  />
                  <span className="input-group-text">x/menit</span>
                </div>
              </Field>
            </div>
            <div className="col-6 col-md-3">
              <Field label="Suhu" name="suhu" error={fe.suhu} required>
                <div className="input-group">
                  <input
                    id="suhu"
                    name="suhu"
                    inputMode="decimal"
                    className={cls("suhu")}
                    defaultValue={v("suhu")}
                    placeholder="36.6"
                  />
                  <span className="input-group-text">°C</span>
                </div>
              </Field>
            </div>
            <div className="col-6 col-md-3">
              <Field label="Gula darah" name="gula_darah" error={fe.gula_darah} required>
                <div className="input-group">
                  <input
                    id="gula_darah"
                    name="gula_darah"
                    inputMode="decimal"
                    className={cls("gula_darah")}
                    defaultValue={v("gula_darah")}
                    placeholder="90"
                  />
                  <span className="input-group-text">mg/dL</span>
                </div>
              </Field>
            </div>
            <div className="col-6 col-md-3">
              <Field label="Berat badan" name="berat_badan" error={fe.berat_badan} required>
                <div className="input-group">
                  <input
                    id="berat_badan"
                    name="berat_badan"
                    inputMode="decimal"
                    className={cls("berat_badan")}
                    defaultValue={v("berat_badan")}
                    placeholder="60"
                  />
                  <span className="input-group-text">kg</span>
                </div>
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">Keluhan</div>
        <div className="card-body">
          <div className="row g-2 mb-3">
            {jenisKeluhan.map((k) => (
              <div className="col-md-6" key={k.id_jenis_keluhan}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="id_jenis_keluhan"
                    value={k.id_jenis_keluhan}
                    id={`k-${k.id_jenis_keluhan}`}
                    defaultChecked={dipilih.has(String(k.id_jenis_keluhan))}
                  />
                  <label className="form-check-label" htmlFor={`k-${k.id_jenis_keluhan}`}>
                    {k.nama_keluhan}
                    {k.tanda_bahaya ? (
                      <span className="mg-badge mg-high ms-2" title="Tanda bahaya">
                        <i className="bi bi-exclamation-triangle-fill" /> tanda bahaya
                      </span>
                    ) : null}
                  </label>
                </div>
              </div>
            ))}
          </div>
          <Field
            label="Keluhan lain"
            name="keluhan_lain"
            error={fe.keluhan_lain}
            hint="Kosongkan bila tidak ada."
          >
            <textarea
              id="keluhan_lain"
              name="keluhan_lain"
              rows={2}
              className={cls("keluhan_lain")}
              defaultValue={v("keluhan_lain")}
            />
          </Field>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">Kontrol berikutnya</div>
        <div className="card-body">
          <div style={{ maxWidth: 280 }}>
            <Field
              label="Tanggal kontrol berikutnya"
              name="tanggal_kontrol_berikutnya"
              error={fe.tanggal_kontrol_berikutnya}
            >
              <input
                id="tanggal_kontrol_berikutnya"
                name="tanggal_kontrol_berikutnya"
                type="date"
                min={hariIni()}
                className={cls("tanggal_kontrol_berikutnya")}
                defaultValue={v("tanggal_kontrol_berikutnya")}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="alert mg-alert small">
        <i className="bi bi-lightbulb me-2" />
        Sistem menghitung kategori risiko dari usia dan tanda vital. Keluhan dan hasil lab belum
        menjadi input perhitungan, tetapi tetap tersimpan untuk bidan.
      </div>

      <div className="d-flex gap-2">
        <SubmitButton pendingText="Menyimpan dan menghitung...">
          <i className="bi bi-check2-circle me-2" />
          Simpan pemeriksaan
        </SubmitButton>
        <Link href={`/ibu-hamil/${ibu.id_ibu}`} className="btn btn-outline-primary">
          Batal
        </Link>
      </div>
    </form>
  );
}

function HasilCard({
  hasil,
  ibu,
  onUlang,
}: {
  hasil: HasilPencatatan;
  ibu: IbuHamil;
  onUlang: () => void;
}) {
  const kategori = hasil.pemeriksaan.skor?.kategori ?? null;
  const wa = hasil.pesan_whatsapp;
  return (
    <div className="d-grid gap-3" style={{ maxWidth: 760 }}>
      <div className="card" style={{ background: "var(--mg-grad-soft)" }}>
        <div className="card-body text-center p-4">
          <div className="text-muted-mg small mb-2">
            Pemeriksaan tersimpan &middot; {formatWaktu(hasil.pemeriksaan.tanggal_pemeriksaan)}
          </div>
          <div className="mb-2 mg-hasil-badge">
            {kategori ? (
              <RiskBadge kategori={kategori} />
            ) : (
              <span className="mg-badge mg-none">Skor belum tersedia</span>
            )}
          </div>
          <p className="mb-0">
            {kategori
              ? PESAN_KATEGORI[kategori]
              : "Pencatatan tetap tersimpan, tetapi skor risiko belum dapat dihitung. Tinjau ibu secara langsung dan coba catat ulang bila perlu."}
          </p>
        </div>
      </div>

      <div className={`alert mg-alert ${wa.dikirim ? "" : "pink"} mb-0`}>
        {wa.dikirim ? (
          <>
            <i className="bi bi-whatsapp me-2" />
            <strong>Pesan kewaspadaan sedang dikirim</strong> ke WhatsApp {ibu.nama}. Pantau
            statusnya di tab Notifikasi.
          </>
        ) : (
          <>
            <i className="bi bi-whatsapp me-2" />
            <strong>Pesan WhatsApp tidak dikirim.</strong> {wa.alasan}
          </>
        )}
        {hasil.jadwal ? (
          <div className="small mt-2">
            Jadwal pesan lanjutan ({hasil.jadwal.status}): {hasil.jadwal.frekuensi},{" "}
            {hasil.jadwal.hari_kirim} pukul {hasil.jadwal.jam_kirim} WIB
            {hasil.jadwal.kirim_berikutnya
              ? `, pesan terjadwal berikutnya ${formatWaktu(hasil.jadwal.kirim_berikutnya)}`
              : ""}
            .
          </div>
        ) : null}
      </div>

      {hasil.pemeriksaan.tanggal_kontrol_berikutnya ? (
        <div className="small text-muted-mg">
          Kontrol berikutnya:{" "}
          <strong>{formatTanggal(hasil.pemeriksaan.tanggal_kontrol_berikutnya)}</strong>
        </div>
      ) : null}

      <Disclaimer />

      <div className="d-flex flex-wrap gap-2">
        <Link href={`/ibu-hamil/${ibu.id_ibu}?tab=notifikasi`} className="btn btn-primary">
          Lihat detail dan notifikasi
        </Link>
        <button type="button" className="btn btn-outline-primary" onClick={onUlang}>
          Catat pemeriksaan lagi
        </button>
        <Link href="/dashboard" className="btn btn-outline-primary">
          Ke dashboard
        </Link>
      </div>
    </div>
  );
}

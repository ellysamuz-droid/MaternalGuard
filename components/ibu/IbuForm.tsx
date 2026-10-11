"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { type FormState, simpanIbuAction } from "@/lib/actions";
import type { IbuHamil } from "@/lib/api/types";
import { Field, FormError, SubmitButton } from "../ui/FormBits";

const initial: FormState = { status: "idle" };

// FR-02: dipakai untuk pendaftaran (tanpa prop ibu) dan ubah data (dengan prop ibu).
export default function IbuForm({ ibu }: { ibu?: IbuHamil }) {
  const [state, action] = useFormState(simpanIbuAction, initial);
  const fe = state.fieldErrors ?? {};
  const v = (k: string, fallback = "") => (state.values?.[k] as string | undefined) ?? fallback;
  const pernah0 = ibu?.riwayat_preeklamsia.toLowerCase().startsWith("pernah") ?? false;
  const [pernah, setPernah] = useState(
    state.values?.riwayat_status ? state.values.riwayat_status === "pernah" : pernah0,
  );
  const detail0 = ibu?.riwayat_preeklamsia.replace(/^Pernah:\s*/i, "") ?? "";
  const cls = (k: string) => `form-control ${fe[k] ? "is-invalid" : ""}`;
  const wa0 =
    state.status === "error"
      ? state.values?.persetujuan_wa === "on"
      : (ibu?.persetujuan_wa ?? false);

  return (
    <form action={action} noValidate>
      {ibu ? <input type="hidden" name="id_ibu" value={ibu.id_ibu} /> : null}
      <FormError message={state.formError} />

      <div className="card mb-3">
        <div className="card-header">Data diri</div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <Field label="Nama lengkap" name="nama" error={fe.nama} required>
                <input
                  id="nama"
                  name="nama"
                  className={cls("nama")}
                  defaultValue={v("nama", ibu?.nama)}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field
                label="Nomor WhatsApp"
                name="no_wa"
                error={fe.no_wa}
                hint="Boleh ditulis 08xx atau 62xx, otomatis disimpan sebagai 62xx."
                required
              >
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-whatsapp" />
                  </span>
                  <input
                    id="no_wa"
                    name="no_wa"
                    inputMode="tel"
                    className={cls("no_wa")}
                    defaultValue={v("no_wa", ibu?.no_wa)}
                    placeholder="081234567890"
                  />
                </div>
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Tanggal lahir" name="tanggal_lahir" error={fe.tanggal_lahir} required>
                <input
                  id="tanggal_lahir"
                  name="tanggal_lahir"
                  type="date"
                  className={cls("tanggal_lahir")}
                  defaultValue={v("tanggal_lahir", ibu?.tanggal_lahir)}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="HPHT (hari pertama haid terakhir)" name="hpht" error={fe.hpht} required>
                <input
                  id="hpht"
                  name="hpht"
                  type="date"
                  className={cls("hpht")}
                  defaultValue={v("hpht", ibu?.hpht)}
                />
              </Field>
            </div>
            <div className="col-12">
              <Field label="Alamat" name="alamat" error={fe.alamat} required>
                <textarea
                  id="alamat"
                  name="alamat"
                  rows={2}
                  className={cls("alamat")}
                  defaultValue={v("alamat", ibu?.alamat)}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">Riwayat kesehatan</div>
        <div className="card-body">
          <fieldset className="mb-3">
            <legend className="form-label fs-6">Riwayat preeklamsia</legend>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="riwayat_status"
                id="rs-tidak"
                value="tidak"
                checked={!pernah}
                onChange={() => setPernah(false)}
              />
              <label className="form-check-label" htmlFor="rs-tidak">
                Tidak ada
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="riwayat_status"
                id="rs-pernah"
                value="pernah"
                checked={pernah}
                onChange={() => setPernah(true)}
              />
              <label className="form-check-label" htmlFor="rs-pernah">
                Pernah
              </label>
            </div>
            {pernah ? (
              <div className="mt-2">
                <input
                  name="riwayat_detail"
                  aria-label="Keterangan riwayat preeklamsia"
                  className={cls("riwayat_detail")}
                  placeholder="Contoh: kehamilan pertama (2021)"
                  defaultValue={v("riwayat_detail", detail0)}
                />
                {fe.riwayat_detail ? (
                  <div className="text-danger small mt-1">{fe.riwayat_detail}</div>
                ) : null}
              </div>
            ) : null}
          </fieldset>
          <Field
            label="Riwayat penyakit lain"
            name="riwayat_lain"
            error={fe.riwayat_lain}
            hint="Kosongkan bila tidak ada."
          >
            <textarea
              id="riwayat_lain"
              name="riwayat_lain"
              rows={2}
              className={cls("riwayat_lain")}
              defaultValue={v("riwayat_lain", ibu?.riwayat_lain)}
            />
          </Field>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">Persetujuan pesan WhatsApp</div>
        <div className="card-body">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              name="persetujuan_wa"
              id="persetujuan_wa"
              defaultChecked={wa0}
            />
            <label className="form-check-label" htmlFor="persetujuan_wa">
              Ibu hamil <strong>telah menyatakan setuju</strong> menerima pesan WhatsApp dari bidan.
            </label>
          </div>
          <div className="form-text mt-2">
            Pesan kewaspadaan hanya dikirim bila persetujuan aktif. Jika dinonaktifkan nanti
            (misalnya ibu meminta berhenti), jadwal pesan ibu ini akan berhenti.
          </div>
        </div>
      </div>

      <div className="d-flex gap-2">
        <SubmitButton>
          <i className="bi bi-check2-circle me-2" />
          {ibu ? "Simpan perubahan" : "Simpan ibu hamil"}
        </SubmitButton>
        <Link
          href={ibu ? `/ibu-hamil/${ibu.id_ibu}` : "/dashboard"}
          className="btn btn-outline-primary"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}

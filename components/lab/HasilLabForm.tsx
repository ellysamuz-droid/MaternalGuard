"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { type FormState, simpanHasilLabAction } from "@/lib/actions";
import { hariIni } from "@/lib/format";
import { DIPSTIK_OPSI } from "@/lib/schemas/hasilLab";
import { Field, FormError, SubmitButton } from "../ui/FormBits";

const initial: FormState = { status: "idle" };

export default function HasilLabForm({ idIbu }: { idIbu: number }) {
  const [state, action] = useFormState(simpanHasilLabAction, initial);
  const fe = state.fieldErrors ?? {};
  const v = (k: string, d = "") => (state.values?.[k] as string | undefined) ?? d;
  const cls = (k: string) => `form-control ${fe[k] ? "is-invalid" : ""}`;

  return (
    <form action={action} noValidate>
      <input type="hidden" name="id_ibu" value={idIbu} />
      <FormError message={state.formError} />
      <div className="card mb-3">
        <div className="card-header">Protein urine</div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <Field label="Tanggal lab" name="tanggal_lab" error={fe.tanggal_lab} required>
                <input
                  id="tanggal_lab"
                  name="tanggal_lab"
                  type="date"
                  max={hariIni()}
                  className={cls("tanggal_lab")}
                  defaultValue={v("tanggal_lab", hariIni())}
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field
                label="Protein urine (dipstik)"
                name="protein_dipstik"
                error={fe.protein_dipstik}
                required
              >
                <select
                  id="protein_dipstik"
                  name="protein_dipstik"
                  className={`form-select ${fe.protein_dipstik ? "is-invalid" : ""}`}
                  defaultValue={v("protein_dipstik")}
                >
                  <option value="">Pilih hasil</option>
                  {DIPSTIK_OPSI.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="col-md-6">
              <Field
                label="Protein urine 24 jam"
                name="protein_24jam"
                error={fe.protein_24jam}
                hint="Boleh dikosongkan."
              >
                <div className="input-group">
                  <input
                    id="protein_24jam"
                    name="protein_24jam"
                    inputMode="decimal"
                    className={cls("protein_24jam")}
                    defaultValue={v("protein_24jam")}
                  />
                  <span className="input-group-text">g/24 jam</span>
                </div>
              </Field>
            </div>
            <div className="col-md-6">
              <Field
                label="Rasio protein/kreatinin"
                name="rasio_protein_kreatinin"
                error={fe.rasio_protein_kreatinin}
                hint="Boleh dikosongkan."
              >
                <input
                  id="rasio_protein_kreatinin"
                  name="rasio_protein_kreatinin"
                  inputMode="decimal"
                  className={cls("rasio_protein_kreatinin")}
                  defaultValue={v("rasio_protein_kreatinin")}
                />
              </Field>
            </div>
            <div className="col-12">
              <Field label="Catatan" name="catatan" error={fe.catatan}>
                <textarea
                  id="catatan"
                  name="catatan"
                  rows={2}
                  className={cls("catatan")}
                  defaultValue={v("catatan")}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>
      <div className="alert mg-alert small">
        Sistem menentukan sendiri status <strong>proteinuria positif</strong> dari hasil di atas.
        Hasil lab belum memengaruhi kategori risiko.
      </div>
      <div className="d-flex gap-2">
        <SubmitButton>
          <i className="bi bi-check2-circle me-2" />
          Simpan hasil lab
        </SubmitButton>
        <Link href={`/ibu-hamil/${idIbu}?tab=lab`} className="btn btn-outline-primary">
          Batal
        </Link>
      </div>
    </form>
  );
}

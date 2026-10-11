"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { type FormState, setPersalinanAction } from "@/lib/actions";
import { hariIni } from "@/lib/format";
import { Field, FormError, SubmitButton } from "../ui/FormBits";

const initial: FormState = { status: "idle" };

// FR-11: tandai belum/sudah lahir. "Sudah lahir" menghentikan semua jadwal pesan ibu.
export default function PersalinanButton({
  idIbu,
  sudahLahir,
}: {
  idIbu: number;
  sudahLahir: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(setPersalinanAction, initial);

  useEffect(() => {
    if (state.status === "success") setOpen(false);
  }, [state.status]);

  const target = sudahLahir ? "belum lahir" : "sudah lahir";

  return (
    <>
      <button type="button" className="btn btn-outline-pink" onClick={() => setOpen(true)}>
        <i className="bi bi-heart-fill me-2" />
        {sudahLahir ? "Tandai belum lahir" : "Tandai sudah lahir"}
      </button>

      {open ? (
        <>
          <div className="modal-backdrop fade show" />
          <div
            className="modal fade show d-block"
            role="dialog"
            aria-modal="true"
            aria-labelledby="persalinan-title"
          >
            <div className="modal-dialog modal-dialog-centered">
              <form
                action={action}
                className="modal-content"
                style={{ borderRadius: "1.1rem", border: 0 }}
              >
                <input type="hidden" name="id_ibu" value={idIbu} />
                <input type="hidden" name="status_persalinan" value={target} />
                <div className="modal-header border-0">
                  <h2 className="modal-title h5" id="persalinan-title">
                    {sudahLahir ? "Ubah menjadi belum lahir?" : "Tandai ibu sudah lahir?"}
                  </h2>
                </div>
                <div className="modal-body">
                  <FormError message={state.formError} />
                  {sudahLahir ? (
                    <div className="alert mg-alert pink small">
                      Ini hanya untuk koreksi data. Jadwal pesan yang sudah berhenti{" "}
                      <strong>tidak aktif kembali</strong> secara otomatis.
                    </div>
                  ) : (
                    <>
                      <div className="alert mg-alert pink small">
                        Semua jadwal pesan WhatsApp ibu ini akan <strong>berhenti</strong>, dan ibu
                        yang sudah lahir tidak dapat dibuatkan jadwal baru.
                      </div>
                      <Field
                        label="Tanggal persalinan"
                        name="tanggal_persalinan"
                        error={state.fieldErrors?.tanggal_persalinan}
                        required
                      >
                        <input
                          id="tanggal_persalinan"
                          name="tanggal_persalinan"
                          type="date"
                          max={hariIni()}
                          defaultValue={hariIni()}
                          className="form-control"
                        />
                      </Field>
                    </>
                  )}
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setOpen(false)}
                  >
                    Batal
                  </button>
                  <SubmitButton>Ya, lanjutkan</SubmitButton>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

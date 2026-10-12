"use client";

import { useFormState } from "react-dom";
import { type FormState, registerAction } from "@/lib/actions";
import { Field, FormError, SubmitButton } from "../ui/FormBits";

const initial: FormState = { status: "idle" };

export default function DaftarForm() {
  const [state, action] = useFormState(registerAction, initial);
  const fe = state.fieldErrors ?? {};
  const val = (k: string) => (state.values?.[k] as string | undefined) ?? "";
  const cls = (k: string) => `form-control ${fe[k] ? "is-invalid" : ""}`;

  return (
    <form action={action} noValidate>
      <FormError message={state.formError} />
      <Field label="Nama lengkap" name="nama" error={fe.nama} required>
        <input
          id="nama"
          name="nama"
          className={cls("nama")}
          defaultValue={val("nama")}
          autoComplete="name"
        />
      </Field>
      <div className="row">
        <div className="col-md-6">
          <Field label="Email" name="email" error={fe.email} required>
            <input
              id="email"
              name="email"
              type="email"
              className={cls("email")}
              defaultValue={val("email")}
              autoComplete="email"
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field
            label="Nomor HP"
            name="no_hp"
            error={fe.no_hp}
            hint="Dicantumkan di pesan WhatsApp agar ibu dapat menghubungi Anda."
            required
          >
            <input
              id="no_hp"
              name="no_hp"
              inputMode="tel"
              className={cls("no_hp")}
              defaultValue={val("no_hp")}
              placeholder="081234567890"
              autoComplete="tel"
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field
            label="Kata sandi"
            name="password"
            error={fe.password}
            hint="Minimal 8 karakter, kombinasi huruf dan angka."
            required
          >
            <input
              id="password"
              name="password"
              type="password"
              className={cls("password")}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <div className="col-md-6">
          <Field label="Ulangi kata sandi" name="konfirmasi" error={fe.konfirmasi} required>
            <input
              id="konfirmasi"
              name="konfirmasi"
              type="password"
              className={cls("konfirmasi")}
              autoComplete="new-password"
            />
          </Field>
        </div>
      </div>

      <div className="form-check mb-1">
        <input
          className={`form-check-input ${fe.setuju ? "is-invalid" : ""}`}
          type="checkbox"
          name="setuju"
          id="setuju"
          defaultChecked={val("setuju") === "on"}
        />
        <label className="form-check-label" htmlFor="setuju">
          Saya bidan yang bertanggung jawab atas data ibu hamil binaan saya, akan meminta
          persetujuan ibu sebelum pesan WhatsApp dikirim, dan memahami bahwa kategori risiko adalah
          peringatan dini, bukan diagnosis.
        </label>
      </div>
      {fe.setuju ? <div className="text-danger small mb-2">{fe.setuju}</div> : null}

      <SubmitButton className="btn btn-primary w-100 mt-3" pendingText="Mendaftarkan...">
        Buat akun bidan
      </SubmitButton>
    </form>
  );
}

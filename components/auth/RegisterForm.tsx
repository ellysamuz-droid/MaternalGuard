"use client";

import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";
import { type RegisterState, registerAction } from "@/lib/actions";

const initialState: RegisterState = { status: "idle" };

export default function RegisterForm({ patients }: { patients: { id: string; name: string }[] }) {
  const [state, setState] = useState<RegisterState>(initialState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await registerAction(state, formData);
      setState(result);
    });
  }

  if (state.status === "success") {
    return (
      <div className="callout" style={{ borderColor: "#2F855A", color: "#2F855A" }}>
        <span>
          Akun berhasil dibuat! Silakan <Link href="/login">masuk</Link> memakai email & kata sandi
          yang baru saja kamu daftarkan.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {state.formError && (
        <div className="callout" style={{ borderColor: "#AE423B", color: "#AE423B" }}>
          <span>{state.formError}</span>
        </div>
      )}

      <div className={`field${state.fieldErrors?.name ? " has-error" : ""}`}>
        <label htmlFor="name">Nama lengkap</label>
        <input id="name" name="name" type="text" placeholder="Nama kamu" required />
        {state.fieldErrors?.name && <span className="field-error">{state.fieldErrors.name}</span>}
      </div>

      <div className={`field${state.fieldErrors?.email ? " has-error" : ""}`}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="kamu@email.com" required />
        {state.fieldErrors?.email && <span className="field-error">{state.fieldErrors.email}</span>}
      </div>

      <div className={`field${state.fieldErrors?.password ? " has-error" : ""}`}>
        <label htmlFor="password">Kata sandi</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Minimal 8 karakter"
          required
        />
        {state.fieldErrors?.password && (
          <span className="field-error">{state.fieldErrors.password}</span>
        )}
      </div>

      <div className={`field${state.fieldErrors?.patientId ? " has-error" : ""}`}>
        <label htmlFor="patientId">Data kehamilan kamu</label>
        <select id="patientId" name="patientId" required defaultValue="">
          <option value="" disabled>
            Pilih namamu di daftar puskesmas
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.patientId && (
          <span className="field-error">{state.fieldErrors.patientId}</span>
        )}
        <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
          Belum ada di daftar? Minta bidan pendampingmu mendaftarkanmu di puskesmas dulu.
        </span>
      </div>

      <input type="hidden" name="puskesmas" value="Puskesmas Manguharjo" />

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: "100%" }}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <span className="spinner spinner-sm" />
            Mendaftarkan...
          </>
        ) : (
          "Daftar"
        )}
      </button>
    </form>
  );
}

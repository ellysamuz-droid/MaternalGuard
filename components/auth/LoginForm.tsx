"use client";

import { type FormEvent, useState, useTransition } from "react";
import { type LoginState, loginAction } from "@/lib/actions";

const initialState: LoginState = { status: "idle" };

// Satu-satunya bagian interaktif pada halaman login: input terkontrol,
// pengiriman FormData ke Server Action `loginAction` (yang memvalidasi ulang
// dengan Zod di server), dan menampilkan error per-field.
export default function LoginForm() {
  const [state, setState] = useState<LoginState>(initialState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(state, formData);
      setState(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {state.formError && (
        <div className="callout" style={{ borderColor: "#AE423B", color: "#AE423B" }}>
          <span>{state.formError}</span>
        </div>
      )}

      <div className={`field${state.fieldErrors?.email ? " has-error" : ""}`}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="bidan@maternalguard.id" required />
        {state.fieldErrors?.email && <span className="field-error">{state.fieldErrors.email}</span>}
      </div>

      <div className={`field${state.fieldErrors?.password ? " has-error" : ""}`}>
        <label htmlFor="password">Kata sandi</label>
        <input id="password" name="password" type="password" placeholder="••••••••" required />
        {state.fieldErrors?.password && (
          <span className="field-error">{state.fieldErrors.password}</span>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: "100%" }}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <span className="spinner spinner-sm" />
            Memeriksa...
          </>
        ) : (
          "Masuk"
        )}
      </button>
    </form>
  );
}

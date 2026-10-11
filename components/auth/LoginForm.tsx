"use client";

import { useFormState } from "react-dom";
import { type FormState, loginAction } from "@/lib/actions";
import { Field, FormError, SubmitButton } from "../ui/FormBits";

const initial: FormState = { status: "idle" };

export default function LoginForm({ from, showDemo }: { from: string; showDemo: boolean }) {
  const [state, action] = useFormState(loginAction, initial);
  const fe = state.fieldErrors ?? {};
  const val = (k: string) => (state.values?.[k] as string | undefined) ?? "";

  return (
    <form action={action} noValidate>
      <input type="hidden" name="from" value={from} />
      <FormError message={state.formError} />
      <Field label="Email" name="email" error={fe.email}>
        <input
          id="email"
          name="email"
          type="email"
          className={`form-control ${fe.email ? "is-invalid" : ""}`}
          placeholder="nama@puskesmas.id"
          defaultValue={val("email")}
          autoComplete="username"
        />
      </Field>
      <Field label="Kata sandi" name="password" error={fe.password}>
        <input
          id="password"
          name="password"
          type="password"
          className={`form-control ${fe.password ? "is-invalid" : ""}`}
          autoComplete="current-password"
        />
      </Field>
      <SubmitButton className="btn btn-primary w-100 mt-2" pendingText="Memeriksa...">
        Masuk
      </SubmitButton>
      {showDemo ? (
        <div className="alert mg-alert small mt-4 mb-0">
          <strong>Mode demo (data tiruan)</strong>
          <br />
          bidan@maternalguard.id
          <br />
          puskesmas123
        </div>
      ) : null}
    </form>
  );
}

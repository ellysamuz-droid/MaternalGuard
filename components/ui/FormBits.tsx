"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Menyimpan...",
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {error ? (
        <div className="text-danger small mt-1" id={`${name}-error`} role="alert">
          {error}
        </div>
      ) : hint ? (
        <div className="form-text">{hint}</div>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="alert mg-alert danger" role="alert">
      <i className="bi bi-exclamation-octagon me-2" />
      {message}
    </div>
  );
}

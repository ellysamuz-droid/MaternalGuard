"use client";

// Konvensi Next.js MEWAJIBKAN error.tsx sebagai Client Component (ini adalah
// satu-satunya pengecualian resmi terhadap aturan "RSC dominan" pada poin b —
// Error Boundary harus bisa memanggil reset() secara interaktif di browser).
import { useEffect } from "react";

export default function PatientDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="state-box is-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p>Gagal memuat riwayat pasien. {error.message || "Terjadi kesalahan tak terduga."}</p>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => reset()}>
        Coba lagi
      </button>
    </div>
  );
}

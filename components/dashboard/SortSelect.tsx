"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const OPTIONS = [
  { value: "risiko", label: "Urutkan: risiko tertinggi" },
  { value: "nama", label: "Urutkan: nama" },
  { value: "usia", label: "Urutkan: usia kehamilan" },
];

// Satu-satunya event listener di halaman dashboard: onChange <select>.
// Alih-alih menyimpan hasil sort di state lokal, komponen ini menulis
// pilihan ke query string (?sort=...) lalu memicu re-render Server
// Component induknya (PatientSection) dengan data yang sudah diurutkan
// di server — pola "URL sebagai state" khas App Router.
export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const current = searchParams.get("sort") ?? "risiko";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    startTransition(() => {
      router.replace(`/dashboard?${params.toString()}`);
    });
  }

  return (
    <select
      aria-label="Urutkan daftar pasien"
      value={current}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

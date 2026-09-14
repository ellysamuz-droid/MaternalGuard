import { getPatients } from "@/lib/data";
import type { Patient } from "@/lib/types";
import UrgentList from "./UrgentList";
import SortSelect from "./SortSelect";
import PatientTable from "./PatientTable";

const SORTERS: Record<string, (a: Patient, b: Patient) => number> = {
  risiko: (a, b) => b.riskScore - a.riskScore,
  nama: (a, b) => a.name.localeCompare(b.name),
  usia: (a, b) => b.week - a.week,
};

// Poin (e) — Streaming SSR: komponen async ini sengaja memanggil data dengan
// delay lebih panjang (1.6s) daripada statistik ringkas di page.tsx. Karena
// dibungkus <Suspense> di DashboardPage, header + kartu statistik langsung
// tampil terlebih dulu, lalu bagian ini "menyusul" begitu datanya siap —
// tanpa memblokir seluruh halaman menunggu query paling lambat.
export default async function PatientSection({ sort }: { sort: string }) {
  const patients = await getPatients(1600);
  const sorted = [...patients].sort(SORTERS[sort] ?? SORTERS.risiko);

  return (
    <>
      <UrgentList patients={sorted} />

      <div className="section-head">
        <h2>Semua pasien binaan</h2>
        <SortSelect />
      </div>

      <PatientTable patients={sorted} />
    </>
  );
}

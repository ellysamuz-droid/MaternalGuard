import type { Metadata } from "next";
import { Suspense } from "react";
import { getDashboardStats } from "@/lib/data";
import StatCard from "@/components/dashboard/StatCard";
import PatientSection from "@/components/dashboard/PatientSection";
import { TableSkeleton } from "@/components/dashboard/DashboardSkeleton";

export const metadata: Metadata = {
  title: "Dashboard Pasien",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  // Query "cepat" — hanya agregat, tidak menunggu seluruh daftar pasien
  // selesai diambil (lihat PatientSection untuk query yang sengaja lambat).
  const stats = await getDashboardStats();
  const sort = searchParams.sort ?? "risiko";

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard Pasien</h1>
          <p>Ringkasan status risiko seluruh ibu hamil binaan Anda hari ini.</p>
        </div>
        <div className="notif-pill">
          <span className="dot" />3 notifikasi baru
        </div>
      </div>

      <section className="stat-grid">
        <StatCard label="Total pasien" value={stats.total} />
        <StatCard label="Risiko tinggi" value={stats.tinggi} tone="danger" />
        <StatCard label="Risiko sedang" value={stats.sedang} tone="warning" />
        <StatCard label="Risiko rendah" value={stats.rendah} tone="success" />
      </section>

      {/* Poin (e) — batas <Suspense> eksplisit: bagian ini di-stream terpisah
          dari header & statistik di atas, dengan fallback skeleton. */}
      <Suspense fallback={<TableSkeleton />}>
        <PatientSection sort={sort} />
      </Suspense>
    </>
  );
}

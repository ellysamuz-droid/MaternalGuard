import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import FilterBar from "@/components/dashboard/FilterBar";
import IbuTable from "@/components/dashboard/IbuTable";
import { TableSkeleton } from "@/components/dashboard/Skeletons";
import StatCards from "@/components/dashboard/StatCards";
import UrgentList from "@/components/dashboard/UrgentList";
import { semuaIbu } from "@/lib/api/guard";

export const metadata: Metadata = { title: "Dashboard" };

type SP = { cari?: string; risiko?: string; persalinan?: string };

export default async function DashboardPage({ searchParams }: { searchParams: SP }) {
  const cari = searchParams.cari?.trim() ?? "";
  const risiko = searchParams.risiko ?? "";
  const persalinan = searchParams.persalinan ?? "";
  // Ringkasan memakai seluruh ibu hamil binaan, tabel memakai filter (FR-03).
  const semua = await semuaIbu();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Ringkasan ibu hamil binaan Anda dan status risikonya saat ini.</p>
        </div>
        <Link href="/ibu-hamil/baru" className="btn btn-primary">
          <i className="bi bi-person-plus-fill me-2" />
          Tambah ibu hamil
        </Link>
      </div>

      <StatCards ibu={semua} />

      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-4 order-xl-2">
          <UrgentList ibu={semua} />
        </div>
        <div className="col-12 col-xl-8 order-xl-1">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 mb-2">
                <i className="bi bi-info-circle me-2" style={{ color: "var(--mg-blue-500)" }} />
                Cara kerja singkat
              </h2>
              <p className="text-muted-mg mb-0">
                Catat pemeriksaan ibu hamil. Sistem menghitung kategori risiko otomatis. Bila{" "}
                <strong>high risk</strong> dan ibu telah setuju, pesan kewaspadaan WhatsApp dikirim
                langsung, lalu dilanjutkan jadwal pesan 2 kali per minggu. Kategori adalah
                peringatan dini, bukan diagnosis.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="h5 mb-3">Daftar ibu hamil</h2>
      <FilterBar cari={cari} risiko={risiko} persalinan={persalinan} />
      <Suspense key={`${cari}|${risiko}|${persalinan}`} fallback={<TableSkeleton />}>
        <IbuTable cari={cari} risiko={risiko} persalinan={persalinan} />
      </Suspense>
    </>
  );
}

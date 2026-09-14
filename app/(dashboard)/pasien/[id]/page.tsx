import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatient } from "@/lib/data";
import PatientBanner from "@/components/patient/PatientBanner";
import TrendHistorySection from "@/components/patient/TrendHistorySection";
import FollowUpForm from "@/components/patient/FollowUpForm";
import FollowUpWidget from "@/components/patient/FollowUpWidget";

type Props = { params: { id: string } };

// Poin (g) — Metadata API dinamis: judul tab menampilkan nama pasien yang
// sedang dilihat bidan, berguna saat banyak tab dibuka sekaligus.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const patient = await getPatient(params.id);
  if (!patient) return { title: "Pasien tidak ditemukan" };

  return {
    title: `${patient.name} · Riwayat Pasien`,
    description: `Riwayat tekanan darah dan keluhan ${patient.name}, ${patient.week} minggu kehamilan, status risiko ${patient.status}.`,
  };
}

export default async function PatientDetailPage({ params }: Props) {
  const patient = await getPatient(params.id);
  if (!patient) notFound();

  return (
    <>
      <Link href="/dashboard" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Kembali ke dashboard
      </Link>

      <PatientBanner patient={patient} />

      <Suspense fallback={<TrendHistorySkeleton />}>
        <TrendHistorySection patient={patient} />
      </Suspense>

      <FollowUpForm patientId={patient.id} patientName={patient.name} />

      {/* Modul 7 — Client UI State (Zustand) & Server State (TanStack Query),
          dipisah tegas dari data RSC di atas. Lihat docs untuk penjelasan. */}
      <FollowUpWidget patientId={patient.id} />
    </>
  );
}

function TrendHistorySkeleton() {
  return (
    <>
      <div className="skeleton-stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-stat-card" />
        ))}
      </div>
      <div className="skeleton skeleton-block" style={{ height: 220, marginBottom: 20 }} />
      <div className="skeleton skeleton-block" style={{ height: 160 }} />
    </>
  );
}

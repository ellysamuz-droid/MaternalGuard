"use client";

import TrendChart from "@/components/patient/TrendChart";
import { useVitalsQuery } from "@/hooks/usePortalQuery";
import { SYMPTOM_LABELS } from "@/lib/types";

export default function PortalRiwayat({ patientId }: { patientId: string }) {
  const { data: vitals, isLoading, isError } = useVitalsQuery(patientId);

  if (isLoading) {
    return (
      <div className="card">
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  }
  if (isError) {
    return <div className="fw-error">Gagal memuat riwayat data.</div>;
  }
  if (!vitals || vitals.length === 0) {
    return <div className="fw-empty">Belum ada riwayat data. Mulai input data harianmu.</div>;
  }

  // Adaptasi VitalEntry -> bentuk yang dipakai TrendChart (HistoryEntry-like).
  const chronological = [...vitals].reverse();
  const chartData = chronological.map((v) => ({
    date: new Date(v.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
    sistolik: v.sistolik,
    diastolik: v.diastolik,
    complaint:
      v.keluhan.length > 0 ? v.keluhan.map((k) => SYMPTOM_LABELS[k]).join(", ") : "Tidak ada",
    severity: (v.keluhan.length >= 3 ? "severe" : v.keluhan.length > 0 ? "mild" : "none") as
      | "none"
      | "mild"
      | "severe",
  }));

  return (
    <>
      <section className="card">
        <h2>Grafik Tren Tekanan Darah</h2>
        <TrendChart history={chartData} />
      </section>
      <section className="card">
        <h2>Riwayat Input</h2>
        <ul className="fw-list">
          {vitals.map((v) => (
            <li key={v.id} className="fw-item">
              <span className="value">
                {v.sistolik}/{v.diastolik} mmHg &middot;{" "}
                {new Date(v.tanggal).toLocaleDateString("id-ID")}
              </span>
              <p>
                {v.keluhan.length > 0
                  ? v.keluhan.map((k) => SYMPTOM_LABELS[k]).join(", ")
                  : "Tidak ada keluhan"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

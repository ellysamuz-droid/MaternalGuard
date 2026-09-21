"use client";

import Link from "next/link";
import { useNotificationsQuery, useVitalsQuery } from "@/hooks/usePortalQuery";

export default function PortalHome({ patientId, name }: { patientId: string; name: string }) {
  const { data: vitals, isLoading: loadingVitals } = useVitalsQuery(patientId);
  const { data: notifications, isLoading: loadingNotif } = useNotificationsQuery(patientId);

  const today = new Date().toISOString().slice(0, 10);
  const hasInputToday = vitals?.some((v) => v.tanggal === today) ?? false;
  const latest = vitals?.[0];

  return (
    <div className="portal-home">
      <header className="page-title">
        <h1>Halo, {name} 👋</h1>
        <p>
          Pantau kondisimu dan keluargamu setiap hari, langkah kecil untuk kehamilan yang sehat.
        </p>
      </header>

      {/* FR-13: reminder input harian */}
      {!loadingVitals && !hasInputToday && (
        <div className="portal-banner warning">
          <strong>Kamu belum input data hari ini.</strong>
          <p>Yuk catat tekanan darah, nadi, berat badan, dan keluhan hari ini.</p>
          <Link href="/portal/input" className="btn btn-primary btn-sm">
            Input sekarang
          </Link>
        </div>
      )}

      {/* FR-09: notifikasi early warning */}
      {!loadingNotif && notifications && notifications.length > 0 && notifications[0] && (
        <div className="portal-banner danger">
          <strong>⚠️ Peringatan Dini Terbaru</strong>
          <p>{notifications[0].message}</p>
        </div>
      )}

      <section className="card">
        <h2>Status Terkini</h2>
        {loadingVitals ? (
          <div className="skeleton" style={{ height: 80 }} />
        ) : latest ? (
          <div className="portal-status">
            <div>
              <span className="label">Tekanan Darah Terakhir</span>
              <span className="value">
                {latest.sistolik}/{latest.diastolik} mmHg
              </span>
            </div>
            <div>
              <span className="label">Tanggal</span>
              <span className="value">{new Date(latest.tanggal).toLocaleDateString("id-ID")}</span>
            </div>
            <div>
              <span className="label">Keluhan</span>
              <span className="value">
                {latest.keluhan.length > 0 ? latest.keluhan.length + " item" : "Tidak ada"}
              </span>
            </div>
          </div>
        ) : (
          <p className="fw-empty">Belum ada data yang diinput. Mulai catat data hari ini, yuk.</p>
        )}
      </section>
    </div>
  );
}

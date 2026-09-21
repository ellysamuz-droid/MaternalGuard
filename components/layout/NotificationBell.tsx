"use client";

import { useState } from "react";
import { useAllNotificationsQuery } from "@/hooks/usePortalQuery";

// FR-09 (sisi Bidan): menampilkan notifikasi early warning dari seluruh
// pasien binaan. Dipoll berkala (lihat useAllNotificationsQuery) sebagai
// pengganti push notification asli — didokumentasikan sebagai keterbatasan
// waktu pengerjaan, bukan klaim push notification sungguhan.
export default function NotificationBell() {
  const { data: notifications, isLoading } = useAllNotificationsQuery();
  const [open, setOpen] = useState(false);
  const count = notifications?.length ?? 0;

  return (
    <div className="notif-bell-wrap">
      <button
        type="button"
        className="notif-bell"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="notif-bell-panel"
      >
        🔔 Peringatan Dini
        {count > 0 && <span className="notif-badge">{count}</span>}
      </button>

      {open && (
        <section id="notif-bell-panel" className="notif-panel" aria-label="Daftar peringatan dini">
          {isLoading && <p className="notif-empty">Memuat...</p>}
          {!isLoading && count === 0 && <p className="notif-empty">Tidak ada peringatan aktif.</p>}
          {!isLoading &&
            notifications?.slice(0, 8).map((n) => (
              <div key={n.id} className={`notif-item level-${n.level}`}>
                <strong>{n.patientId}</strong>
                <span>{n.message}</span>
                <time>{new Date(n.createdAt).toLocaleString("id-ID")}</time>
              </div>
            ))}
        </section>
      )}
    </div>
  );
}

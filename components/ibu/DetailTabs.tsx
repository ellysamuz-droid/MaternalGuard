"use client";

import { useEffect } from "react";
import { type DetailTab, useDetailTabStore } from "@/store/useDetailTabStore";

const TABS: { id: DetailTab; label: string; icon: string }[] = [
  { id: "data", label: "Data diri", icon: "bi-person-vcard" },
  { id: "pemeriksaan", label: "Pemeriksaan", icon: "bi-heart-pulse" },
  { id: "lab", label: "Hasil lab", icon: "bi-droplet-half" },
  { id: "notifikasi", label: "Notifikasi", icon: "bi-whatsapp" },
  { id: "jadwal", label: "Jadwal pesan", icon: "bi-calendar-check" },
];

// Semua panel dirender server/klien sekaligus (agar polling tetap jalan dan data
// sudah siap), tab hanya menampilkan atau menyembunyikan lewat CSS.
export default function DetailTabs({
  awal,
  panels,
}: {
  awal: DetailTab;
  panels: Record<DetailTab, React.ReactNode>;
}) {
  const tab = useDetailTabStore((s) => s.tab);
  const setTab = useDetailTabStore((s) => s.setTab);

  useEffect(() => setTab(awal), [awal, setTab]);

  return (
    <>
      <div className="mg-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            <i className={`bi ${t.icon} me-2`} />
            {t.label}
          </button>
        ))}
      </div>
      {TABS.map((t) => (
        <section key={t.id} role="tabpanel" hidden={tab !== t.id}>
          {panels[t.id]}
        </section>
      ))}
    </>
  );
}

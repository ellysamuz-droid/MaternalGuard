import Link from "next/link";
import type { Patient } from "@/lib/types";

const STATUS_LABEL: Record<Patient["status"], string> = {
  tinggi: "Tinggi",
  sedang: "Sedang",
  rendah: "Rendah",
};

// Server Component: seluruh baris memakai <Link> (navigasi murni, tanpa
// onClick/onNavigate), sehingga tidak perlu 'use client' sama sekali.
export default function PatientTable({ patients }: { patients: Patient[] }) {
  return (
    <div className="table-card">
      <div className="t-row head">
        <span>Pasien</span>
        <span>Tensi terakhir</span>
        <span>Status</span>
        <span></span>
        <span></span>
      </div>

      {patients.map((p) => (
        <div className="t-row t-row-click" key={p.id}>
          {/* Stretched-link murni CSS: seluruh baris bisa diklik menuju detail
              pasien tanpa event listener JS, sekaligus tidak menumpuk <a> di
              dalam <a> (invalid HTML) untuk tombol "Catat periksa". */}
          <Link href={`/pasien/${p.id}`} className="row-link-overlay" aria-label={`Lihat detail ${p.name}`} />
          <span>
            {p.name} &middot; {p.week} minggu
          </span>
          <span className="vital-num">
            {p.sistolik}/{p.diastolik}
          </span>
          <span className={`badge ${p.status}`}>{STATUS_LABEL[p.status]}</span>
          <Link href={`/periksa/${p.id}`} className="btn btn-ghost btn-sm row-link-action">
            Catat periksa
          </Link>
          <span className="chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </div>
      ))}
    </div>
  );
}

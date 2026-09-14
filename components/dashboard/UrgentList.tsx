import Link from "next/link";
import type { Patient } from "@/lib/types";

export default function UrgentList({ patients }: { patients: Patient[] }) {
  const urgent = patients.filter((p) => p.status === "tinggi" || p.status === "sedang").slice(0, 2);

  if (urgent.length === 0) return null;

  return (
    <section className="panel">
      <p className="panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Perlu tindak lanjut segera
      </p>

      {urgent.map((p) => (
        <div className="patient-row" key={p.id}>
          <div className="patient-id">
            <div className={`avatar ${p.status}`}>{p.name.replace("Ibu ", "I")}</div>
            <div>
              <p className="name">
                {p.name} &middot; {p.week} minggu
              </p>
              <p className="meta">
                <span className="vital">
                  {p.sistolik}/{p.diastolik}
                </span>{" "}
                &middot; {p.complaint}
              </p>
            </div>
          </div>
          <div className="row-actions">
            <Link href={`/pasien/${p.id}`} className="btn btn-outline btn-sm">
              Lihat detail
            </Link>
            <Link href={`/periksa/${p.id}`} className="btn btn-primary btn-sm">
              Catat hasil periksa
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}

import Link from "next/link";
import type { IbuHamil } from "@/lib/api/types";
import { hitungMingguKehamilan, inisial } from "@/lib/format";
import { RiskBadge } from "../ui/Badges";

export default function UrgentList({ ibu }: { ibu: IbuHamil[] }) {
  const urgent = ibu.filter(
    (i) => i.status_risiko === "high risk" && i.status_persalinan === "belum lahir",
  );
  return (
    <div className="card h-100">
      <div className="card-header d-flex align-items-center gap-2">
        <i className="bi bi-bell-fill" style={{ color: "var(--mg-pink-500)" }} /> Perlu perhatian
      </div>
      <div className="card-body">
        {urgent.length === 0 ? (
          <p className="text-muted-mg mb-0">
            Tidak ada ibu hamil dengan kategori high risk saat ini.
          </p>
        ) : (
          <ul className="list-unstyled mb-0 d-grid gap-3">
            {urgent.map((i) => (
              <li key={i.id_ibu}>
                <Link
                  href={`/ibu-hamil/${i.id_ibu}`}
                  className="d-flex align-items-center gap-3 text-decoration-none text-reset"
                >
                  <span className="mg-avatar sm">{inisial(i.nama)}</span>
                  <span className="flex-grow-1">
                    <strong className="d-block">{i.nama}</strong>
                    <span className="small text-muted-mg">
                      {hitungMingguKehamilan(i.hpht)} minggu
                    </span>
                  </span>
                  <RiskBadge kategori={i.status_risiko} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

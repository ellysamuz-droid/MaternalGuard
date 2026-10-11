import Link from "next/link";
import * as api from "@/lib/api/endpoints";
import { ambil } from "@/lib/api/guard";
import { hitungMingguKehamilan, hitungUsia, inisial } from "@/lib/format";
import { PersalinanBadge, RiskBadge, WaBadge } from "../ui/Badges";

export default async function IbuTable({
  cari,
  risiko,
  persalinan,
}: {
  cari: string;
  risiko: string;
  persalinan: string;
}) {
  const rows = await ambil(() =>
    api.getIbuHamilList({ cari, status_risiko: risiko, status_persalinan: persalinan }),
  );
  const urutan = { "high risk": 0, "mid risk": 1, "low risk": 2 } as const;
  // Ibu yang belum lahir lebih dulu, lalu urut risiko (high -> low), lalu nama.
  const sorted = [...rows].sort(
    (a, b) =>
      Number(a.status_persalinan === "sudah lahir") -
        Number(b.status_persalinan === "sudah lahir") ||
      (a.status_risiko ? urutan[a.status_risiko] : 3) -
        (b.status_risiko ? urutan[b.status_risiko] : 3) ||
      a.nama.localeCompare(b.nama),
  );

  return (
    <div className="card">
      <div className="card-body p-0">
        {sorted.length === 0 ? (
          <p className="text-center text-muted-mg p-5 mb-0">
            Tidak ada ibu hamil yang cocok dengan pencarian ini.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th className="ps-4">Nama</th>
                  <th>Usia / minggu</th>
                  <th>Status risiko</th>
                  <th>Persalinan</th>
                  <th>WhatsApp</th>
                  <th className="text-end pe-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((i) => (
                  <tr key={i.id_ibu}>
                    <td className="ps-4">
                      <Link
                        href={`/ibu-hamil/${i.id_ibu}`}
                        className="d-flex align-items-center gap-3 text-decoration-none text-reset"
                      >
                        <span className="mg-avatar sm">{inisial(i.nama)}</span>
                        <span>
                          <strong className="d-block">{i.nama}</strong>
                          <span className="small text-muted-mg">{i.no_wa}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="text-nowrap">
                      {hitungUsia(i.tanggal_lahir)} th
                      <span className="text-muted-mg"> / </span>
                      {i.status_persalinan === "sudah lahir"
                        ? "-"
                        : `${hitungMingguKehamilan(i.hpht)} mgg`}
                    </td>
                    <td>
                      <RiskBadge kategori={i.status_risiko} />
                    </td>
                    <td>
                      <PersalinanBadge status={i.status_persalinan} />
                    </td>
                    <td>
                      <WaBadge aktif={i.persetujuan_wa} />
                    </td>
                    <td className="text-end pe-4 text-nowrap">
                      <Link
                        href={`/ibu-hamil/${i.id_ibu}`}
                        className="btn btn-outline-primary btn-sm me-1"
                      >
                        Detail
                      </Link>
                      {i.status_persalinan === "belum lahir" ? (
                        <Link
                          href={`/ibu-hamil/${i.id_ibu}/pemeriksaan/baru`}
                          className="btn btn-primary btn-sm"
                        >
                          Periksa
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

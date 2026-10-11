import Link from "next/link";
import * as api from "@/lib/api/endpoints";
import { ambil } from "@/lib/api/guard";
import { formatTanggal } from "@/lib/format";

export default async function LabSection({ idIbu }: { idIbu: number }) {
  const rows = await ambil(() => api.getHasilLab(idIbu));
  return (
    <div className="d-grid gap-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 className="h5 mb-0">Hasil lab protein urine</h2>
        <Link href={`/ibu-hamil/${idIbu}/hasil-lab/baru`} className="btn btn-primary btn-sm">
          <i className="bi bi-droplet-half me-2" />
          Catat hasil lab
        </Link>
      </div>
      <div className="alert mg-alert small mb-0">
        <i className="bi bi-info-circle me-2" />
        Hasil lab ditampilkan sebagai pendukung keputusan bidan dan{" "}
        <strong>belum menjadi input</strong> penghitungan kategori risiko.
      </div>
      <div className="card">
        <div className="card-body p-0">
          {rows.length === 0 ? (
            <p className="text-center text-muted-mg p-5 mb-0">Belum ada hasil lab tercatat.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th className="ps-4">Tanggal</th>
                    <th>Dipstik</th>
                    <th>Protein 24 jam (g)</th>
                    <th>Rasio protein/kreatinin</th>
                    <th>Proteinuria</th>
                    <th className="pe-4">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <tr key={l.id_lab}>
                      <td className="ps-4 text-nowrap">{formatTanggal(l.tanggal_lab)}</td>
                      <td className="fw-semibold">{l.protein_dipstik}</td>
                      <td>{l.protein_24jam ?? "-"}</td>
                      <td>{l.rasio_protein_kreatinin ?? "-"}</td>
                      <td>
                        {l.proteinuria_positif ? (
                          <span className="mg-badge mg-high">Positif</span>
                        ) : (
                          <span className="mg-badge mg-low">Negatif</span>
                        )}
                      </td>
                      <td className="pe-4">{l.catatan || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

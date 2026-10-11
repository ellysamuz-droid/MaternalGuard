import Link from "next/link";
import * as api from "@/lib/api/endpoints";
import { ambil } from "@/lib/api/guard";
import { formatTanggal, formatWaktu } from "@/lib/format";
import { RiskBadge } from "../ui/Badges";
import Disclaimer from "../ui/Disclaimer";
import TrendChart from "./TrendChart";

export default async function PemeriksaanSection({
  idIbu,
  boleh,
}: {
  idIbu: number;
  boleh: boolean;
}) {
  const rows = await ambil(() => api.getPemeriksaan(idIbu)); // terbaru lebih dulu
  const asc = [...rows].reverse();

  return (
    <div className="d-grid gap-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 className="h5 mb-0">Riwayat pemeriksaan</h2>
        {boleh ? (
          <Link href={`/ibu-hamil/${idIbu}/pemeriksaan/baru`} className="btn btn-primary btn-sm">
            <i className="bi bi-clipboard2-plus me-2" />
            Catat pemeriksaan
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted-mg p-5">
            Belum ada pemeriksaan tercatat.
          </div>
        </div>
      ) : (
        <>
          {asc.length >= 2 ? (
            <div className="card">
              <div className="card-header">Tren tekanan darah</div>
              <div className="card-body">
                <TrendChart
                  titik={asc.map((p) => ({
                    label: formatTanggal(p.tanggal_pemeriksaan),
                    sistolik: p.vital.sistolik,
                    diastolik: p.vital.diastolik,
                    kategori: p.skor?.kategori ?? "belum tersedia",
                  }))}
                />
              </div>
            </div>
          ) : null}

          <div className="card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th className="ps-4">Tanggal</th>
                      <th>Tekanan darah</th>
                      <th>Nadi</th>
                      <th>Suhu</th>
                      <th>Gula darah</th>
                      <th>Berat</th>
                      <th>Keluhan</th>
                      <th>Kategori</th>
                      <th className="pe-4">Kontrol berikutnya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.id_pemeriksaan}>
                        <td className="ps-4 text-nowrap">{formatWaktu(p.tanggal_pemeriksaan)}</td>
                        <td className="fw-semibold text-nowrap">
                          {p.vital.sistolik}/{p.vital.diastolik}{" "}
                          <span className="text-muted-mg fw-normal">mmHg</span>
                        </td>
                        <td>{p.vital.nadi ?? "-"}</td>
                        <td className="text-nowrap">{p.vital.suhu} °C</td>
                        <td className="text-nowrap">{p.vital.gula_darah} mg/dL</td>
                        <td className="text-nowrap">{p.vital.berat_badan} kg</td>
                        <td style={{ minWidth: 200 }}>
                          {p.keluhan.length === 0 && !p.keluhan_lain ? (
                            <span className="text-muted-mg">-</span>
                          ) : (
                            <div className="d-flex flex-wrap gap-1">
                              {p.keluhan.map((k) => (
                                <span
                                  key={k.id_jenis_keluhan}
                                  className={`mg-badge ${k.tanda_bahaya ? "mg-high" : "mg-none"}`}
                                >
                                  {k.nama_keluhan}
                                </span>
                              ))}
                              {p.keluhan_lain ? (
                                <span className="small text-muted-mg">+ {p.keluhan_lain}</span>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td>
                          {p.skor ? (
                            <RiskBadge kategori={p.skor.kategori} />
                          ) : (
                            <span className="mg-badge mg-none">Skor belum tersedia</span>
                          )}
                        </td>
                        <td className="pe-4 text-nowrap">
                          {formatTanggal(p.tanggal_kontrol_berikutnya)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <Disclaimer />
        </>
      )}
    </div>
  );
}

"use client";

import { useJadwalQuery, useUbahJadwalMutation } from "@/hooks/useIbuQueries";
import { formatTanggal, formatWaktu } from "@/lib/format";
import { StatusJadwalBadge } from "../ui/Badges";

// FR-08 (lihat jadwal) dan FR-12 (jeda / aktifkan kembali).
export default function JadwalPanel({ idIbu }: { idIbu: number }) {
  const { data, isPending, isError, error } = useJadwalQuery(idIbu);
  const ubah = useUbahJadwalMutation(idIbu);

  return (
    <div className="d-grid gap-3">
      <h2 className="h5 mb-0">Jadwal pesan WhatsApp</h2>
      <div className="alert mg-alert small mb-0">
        Pesan lanjutan dikirim <strong>2 kali per minggu</strong> pada hari dan jam tetap, dengan
        tema bergilir dan nada tenang. Jadwal berhenti otomatis bila ibu sudah lahir, persetujuan
        WhatsApp dicabut, atau kategori turun ke low/mid risk.
      </div>
      {ubah.isError ? (
        <div className="alert mg-alert danger" role="alert">
          {ubah.error instanceof Error ? ubah.error.message : "Gagal mengubah jadwal."}
        </div>
      ) : null}

      {isPending ? (
        <div className="skeleton" style={{ height: 140 }} />
      ) : isError ? (
        <div className="alert mg-alert danger" role="alert">
          {error instanceof Error ? error.message : "Gagal memuat jadwal."}
        </div>
      ) : data.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted-mg p-5">
            Belum ada jadwal pesan untuk ibu ini.
          </div>
        </div>
      ) : (
        data.map((j) => (
          <div className="card" key={j.id_jadwal}>
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <StatusJadwalBadge status={j.status} />
                {j.status === "berhenti" ? null : (
                  <button
                    type="button"
                    className={`btn btn-sm ${j.status === "aktif" ? "btn-outline-pink" : "btn-primary"}`}
                    disabled={ubah.isPending}
                    onClick={() =>
                      ubah.mutate({
                        idJadwal: j.id_jadwal,
                        status: j.status === "aktif" ? "dijeda" : "aktif",
                      })
                    }
                  >
                    {j.status === "aktif" ? (
                      <>
                        <i className="bi bi-pause-fill me-1" /> Jeda jadwal
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-fill me-1" /> Aktifkan kembali
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="small text-muted-mg">Frekuensi</div>
                  <div className="fw-semibold">{j.frekuensi}</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="small text-muted-mg">Hari dan jam kirim</div>
                  <div className="fw-semibold">
                    {j.hari_kirim}, {j.jam_kirim} WIB
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="small text-muted-mg">Mulai</div>
                  <div className="fw-semibold">{formatTanggal(j.tanggal_mulai)}</div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="small text-muted-mg">
                    {j.status === "berhenti" ? "Berhenti" : "Pesan berikutnya"}
                  </div>
                  <div className="fw-semibold">
                    {j.status === "berhenti"
                      ? formatTanggal(j.tanggal_berhenti)
                      : j.status === "dijeda"
                        ? "Ditunda"
                        : formatWaktu(j.kirim_berikutnya)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

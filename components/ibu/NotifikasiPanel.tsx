"use client";

import { useNotifikasiQuery } from "@/hooks/useIbuQueries";
import { formatWaktu } from "@/lib/format";
import { StatusKirimBadge } from "../ui/Badges";

// FR-10. Client Component karena memakai TanStack Query (polling status webhook).
export default function NotifikasiPanel({ idIbu }: { idIbu: number }) {
  const { data, isPending, isError, error, refetch, isFetching } = useNotifikasiQuery(idIbu);

  return (
    <div className="d-grid gap-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 className="h5 mb-0">Riwayat notifikasi WhatsApp</h2>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <i className={`bi bi-arrow-clockwise me-1 ${isFetching ? "spin" : ""}`} />
          Muat ulang
        </button>
      </div>
      <div className="alert mg-alert small mb-0">
        Setiap upaya pengiriman tercatat dan tidak dapat diubah atau dihapus. Status berubah dari{" "}
        <strong>menunggu</strong> menjadi <strong>terkirim</strong>, lalu <strong>diterima</strong>{" "}
        atau <strong>gagal</strong> setelah laporan dari WhatsApp masuk.
      </div>

      {isPending ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : isError ? (
        <div className="alert mg-alert danger" role="alert">
          {error instanceof Error ? error.message : "Gagal memuat riwayat notifikasi."}
        </div>
      ) : data.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted-mg p-5">
            Belum ada pesan terkirim ke ibu ini. Pesan dikirim otomatis saat kategori high risk dan
            ibu telah setuju.
          </div>
        </div>
      ) : (
        <div className="d-grid gap-3">
          {data.map((n) => (
            <div className="card" key={n.id_notifikasi}>
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                  <span className="small text-muted-mg">
                    <i className="bi bi-clock me-1" />
                    {formatWaktu(n.waktu_kirim)} &middot; ke {n.no_wa_tujuan}
                  </span>
                  <StatusKirimBadge status={n.status_kirim} />
                </div>
                <div className="wa-bubble">{n.isi_pesan}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import type { IbuHamil } from "@/lib/api/types";
import { formatTanggal, hitungUsia } from "@/lib/format";
import PersalinanButton from "./PersalinanButton";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="col-md-6">
      <div className="small text-muted-mg">{label}</div>
      <div className="fw-semibold">{children}</div>
    </div>
  );
}

export default function DataDiri({ ibu }: { ibu: IbuHamil }) {
  const lahir = ibu.status_persalinan === "sudah lahir";
  return (
    <div className="card">
      <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
        Data diri
        <Link href={`/ibu-hamil/${ibu.id_ibu}/ubah`} className="btn btn-outline-primary btn-sm">
          <i className="bi bi-pencil me-1" /> Ubah data
        </Link>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <Row label="Nomor WhatsApp">{ibu.no_wa}</Row>
          <Row label="Tanggal lahir">
            {formatTanggal(ibu.tanggal_lahir)} ({hitungUsia(ibu.tanggal_lahir)} tahun)
          </Row>
          <Row label="HPHT">{formatTanggal(ibu.hpht)}</Row>
          <Row label="Alamat">{ibu.alamat}</Row>
          <Row label="Riwayat preeklamsia">{ibu.riwayat_preeklamsia || "-"}</Row>
          <Row label="Riwayat penyakit lain">{ibu.riwayat_lain || "-"}</Row>
          <Row label="Persetujuan WhatsApp">
            {ibu.persetujuan_wa ? "Setuju menerima pesan" : "Belum setuju"}
          </Row>
          <Row label="Status persalinan">
            {lahir ? `Sudah lahir (${formatTanggal(ibu.tanggal_persalinan)})` : "Belum lahir"}
          </Row>
        </div>
        <hr />
        <PersalinanButton idIbu={ibu.id_ibu} sudahLahir={lahir} />
      </div>
    </div>
  );
}

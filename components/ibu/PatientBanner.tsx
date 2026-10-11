import type { IbuHamil } from "@/lib/api/types";
import { hitungMingguKehamilan, hitungUsia, inisial } from "@/lib/format";
import { PersalinanBadge, RiskBadge, WaBadge } from "../ui/Badges";

export default function PatientBanner({ ibu }: { ibu: IbuHamil }) {
  const lahir = ibu.status_persalinan === "sudah lahir";
  return (
    <div className="card mb-3" style={{ background: "var(--mg-grad-soft)" }}>
      <div className="card-body d-flex flex-wrap align-items-center gap-3">
        <span className="mg-avatar">{inisial(ibu.nama)}</span>
        <div className="flex-grow-1">
          <h1 className="h4 mb-1">{ibu.nama}</h1>
          <div className="text-muted-mg">
            {hitungUsia(ibu.tanggal_lahir)} tahun
            {lahir ? "" : ` \u00b7 ${hitungMingguKehamilan(ibu.hpht)} minggu kehamilan`}
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <RiskBadge kategori={ibu.status_risiko} />
          <PersalinanBadge status={ibu.status_persalinan} />
          <WaBadge aktif={ibu.persetujuan_wa} />
        </div>
      </div>
    </div>
  );
}

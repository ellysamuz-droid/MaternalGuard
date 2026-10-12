import type { KategoriRisiko, StatusJadwal, StatusKirim, StatusPersalinan } from "@/lib/api/types";

export function RiskBadge({ kategori }: { kategori: KategoriRisiko | null | undefined }) {
  if (!kategori) {
    return (
      <span className="mg-badge mg-none">
        <i className="bi bi-dash-circle" /> Belum diperiksa
      </span>
    );
  }
  const map = {
    "high risk": { cls: "mg-high", icon: "bi-exclamation-triangle-fill", label: "High risk" },
    "mid risk": { cls: "mg-mid", icon: "bi-exclamation-circle-fill", label: "Mid risk" },
    "low risk": { cls: "mg-low", icon: "bi-check-circle-fill", label: "Low risk" },
  } as const;
  const m = map[kategori];
  return (
    <span className={`mg-badge ${m.cls}`}>
      <i className={`bi ${m.icon}`} /> {m.label}
    </span>
  );
}

export function StatusKirimBadge({ status }: { status: StatusKirim }) {
  const map = {
    menunggu: { cls: "mg-none", icon: "bi-hourglass-split", label: "Menunggu" },
    terkirim: { cls: "mg-info", icon: "bi-check2", label: "Terkirim" },
    diterima: { cls: "mg-low", icon: "bi-check2-all", label: "Diterima" },
    gagal: { cls: "mg-high", icon: "bi-x-circle", label: "Gagal" },
  } as const;
  const m = map[status];
  return (
    <span className={`mg-badge ${m.cls}`}>
      <i className={`bi ${m.icon}`} /> {m.label}
    </span>
  );
}

export function StatusJadwalBadge({ status }: { status: StatusJadwal }) {
  const map = {
    aktif: { cls: "mg-low", icon: "bi-play-fill", label: "Aktif" },
    dijeda: { cls: "mg-mid", icon: "bi-pause-fill", label: "Dijeda" },
    berhenti: { cls: "mg-none", icon: "bi-stop-fill", label: "Berhenti" },
  } as const;
  const m = map[status];
  return (
    <span className={`mg-badge ${m.cls}`}>
      <i className={`bi ${m.icon}`} /> {m.label}
    </span>
  );
}

export function PersalinanBadge({ status }: { status: StatusPersalinan }) {
  return status === "sudah lahir" ? (
    <span className="mg-badge mg-pink">
      <i className="bi bi-heart-fill" /> Sudah lahir
    </span>
  ) : (
    <span className="mg-badge mg-info">
      <i className="bi bi-hourglass-top" /> Belum lahir
    </span>
  );
}

export function WaBadge({ aktif }: { aktif: boolean }) {
  return aktif ? (
    <span className="mg-badge mg-low">
      <i className="bi bi-whatsapp" /> Setuju
    </span>
  ) : (
    <span className="mg-badge mg-none">
      <i className="bi bi-whatsapp" /> Belum setuju
    </span>
  );
}

import type { IbuHamil } from "@/lib/api/types";

export default function StatCards({ ibu }: { ibu: IbuHamil[] }) {
  const aktif = ibu.filter((i) => i.status_persalinan === "belum lahir");
  const count = (k: string) => aktif.filter((i) => i.status_risiko === k).length;
  const items = [
    {
      label: "Ibu hamil aktif",
      value: aktif.length,
      icon: "bi-people-fill",
      bg: "var(--mg-blue-100)",
      fg: "var(--mg-blue-700)",
    },
    {
      label: "High risk",
      value: count("high risk"),
      icon: "bi-exclamation-triangle-fill",
      bg: "#fde1e9",
      fg: "#a3173f",
    },
    {
      label: "Mid risk",
      value: count("mid risk"),
      icon: "bi-exclamation-circle-fill",
      bg: "#fff0d4",
      fg: "#8a5a00",
    },
    {
      label: "Low risk",
      value: count("low risk"),
      icon: "bi-check-circle-fill",
      bg: "#dcf4e8",
      fg: "#1c6a48",
    },
  ];
  return (
    <div className="row g-3 mb-4">
      {items.map((s) => (
        <div className="col-6 col-xl-3" key={s.label}>
          <div className="card h-100">
            <div className="card-body mg-stat">
              <span className="icon" style={{ background: s.bg, color: s.fg }}>
                <i className={`bi ${s.icon}`} />
              </span>
              <div>
                <div className="value">{s.value}</div>
                <div className="label">{s.label}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

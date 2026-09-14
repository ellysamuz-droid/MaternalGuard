import type { HistoryEntry } from "@/lib/types";

export default function HistoryTable({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="table-card">
      <div className="history-row head">
        <span>Tanggal</span>
        <span>Tensi</span>
        <span>Keluhan</span>
      </div>
      {history.map((h) => (
        <div className={`history-row${h.severity === "severe" ? " flagged" : ""}`} key={h.date}>
          <span style={h.severity === "severe" ? { fontWeight: 600 } : undefined}>{h.date}</span>
          <span
            className="vital-num"
            style={h.severity === "severe" ? { fontWeight: 600 } : undefined}
          >
            {h.sistolik}/{h.diastolik}
          </span>
          <span className={`complaint-${h.severity}`}>{h.complaint}</span>
        </div>
      ))}
    </div>
  );
}

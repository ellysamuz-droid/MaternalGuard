import { getPatientHistory } from "@/lib/data";
import type { Patient } from "@/lib/types";
import HistoryTable from "./HistoryTable";
import TrendChart from "./TrendChart";

// Query paling lambat pada halaman detail (1.1s) — dipisah dari banner agar
// bisa di-stream belakangan lewat <Suspense> (poin e). Baseline & tensi
// terbaru dihitung dari histori 7 hari, sehingga kartu ini memang harus
// menunggu data yang sama dengan grafik & tabel riwayat.
export default async function TrendHistorySection({ patient }: { patient: Patient }) {
  const history = await getPatientHistory(patient.id);
  const baseline = history[0];
  const latest = history[history.length - 1];

  return (
    <>
      <section className="vital-strip">
        <div className="stat-card">
          <p className="label">Tensi hari ini</p>
          <p className="value">
            {latest?.sistolik ?? patient.sistolik}/{latest?.diastolik ?? patient.diastolik}
          </p>
        </div>
        <div className="stat-card">
          <p className="label">Baseline normal</p>
          <p className="value">
            {baseline?.sistolik ?? "–"}/{baseline?.diastolik ?? "–"}
          </p>
        </div>
        <div className="stat-card">
          <p className="label">Risk score</p>
          <p className="value">
            {patient.riskScore}
            <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>/100</span>
          </p>
        </div>
      </section>

      <div className="section-head">
        <h2>Tren tekanan darah, 7 hari terakhir</h2>
      </div>
      <TrendChart history={history} />

      <div className="section-head">
        <h2>Riwayat keluhan harian</h2>
      </div>
      <HistoryTable history={history} />
    </>
  );
}

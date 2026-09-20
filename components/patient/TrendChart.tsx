"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { HistoryEntry } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// 'use client' di sini WAJIB: Chart.js memanipulasi <canvas> langsung di
// browser dan tidak bisa dirender di server. Ini contoh isolasi komponen
// klien pada bagian "daun" hirarki (poin c) — parent-nya (halaman detail
// pasien) tetap Server Component, hanya elemen visual interaktif ini yang
// dikirim sebagai JS ke klien.
export default function TrendChart({ history }: { history: HistoryEntry[] }) {
  const data = {
    labels: history.map((h) => h.date),
    datasets: [
      {
        label: "Sistolik",
        data: history.map((h) => h.sistolik),
        borderColor: "#AE423B",
        backgroundColor: "rgba(174,66,59,0.08)",
        borderWidth: 2,
        pointRadius: 3.5,
        pointBackgroundColor: "#AE423B",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Diastolik",
        data: history.map((h) => h.diastolik),
        borderColor: "#0E6E7C",
        backgroundColor: "rgba(14,110,124,0.06)",
        borderWidth: 2,
        pointRadius: 3.5,
        pointBackgroundColor: "#0E6E7C",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false as const } },
    scales: { y: { beginAtZero: false } },
  };

  return (
    <div className="chart-wrap">
      <Line data={data} options={options} />
      <div className="legend">
        <span>
          <i style={{ background: "#AE423B" }} />
          Sistolik (mmHg)
        </span>
        <span>
          <i style={{ background: "#0E6E7C" }} />
          Diastolik (mmHg)
        </span>
      </div>
    </div>
  );
}

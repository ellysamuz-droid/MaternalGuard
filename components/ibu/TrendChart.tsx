"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export interface TitikTren {
  label: string;
  sistolik: number;
  diastolik: number;
  kategori: string;
}

// 'use client' wajib: Chart.js memanipulasi <canvas> di browser.
export default function TrendChart({ titik }: { titik: TitikTren[] }) {
  const data = {
    labels: titik.map((t) => t.label),
    datasets: [
      {
        label: "Sistolik (mmHg)",
        data: titik.map((t) => t.sistolik),
        borderColor: "#e07aa4",
        backgroundColor: "rgba(224,122,164,0.15)",
        pointBackgroundColor: "#e07aa4",
        borderWidth: 2.5,
        pointRadius: 4,
        tension: 0.35,
        fill: true,
      },
      {
        label: "Diastolik (mmHg)",
        data: titik.map((t) => t.diastolik),
        borderColor: "#5f98dc",
        backgroundColor: "rgba(95,152,220,0.15)",
        pointBackgroundColor: "#5f98dc",
        borderWidth: 2.5,
        pointRadius: 4,
        tension: 0.35,
        fill: true,
      },
    ],
  };
  return (
    <div style={{ height: 260 }}>
      <Line
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
            tooltip: {
              callbacks: {
                afterBody: (items) => {
                  const k = titik[items[0]?.dataIndex ?? 0]?.kategori;
                  return k ? `Kategori: ${k}` : "";
                },
              },
            },
          },
          scales: {
            y: { suggestedMin: 60, suggestedMax: 170, grid: { color: "#edf2fb" } },
            x: { grid: { display: false } },
          },
        }}
      />
    </div>
  );
}

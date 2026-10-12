import { useState } from "react";
import "./App.css";

// ---------------------------------------------------------------------------
// MaternalGuard Build Tools Lab — Modul 8
// Dashboard ini menampilkan hasil BENCHMARK NYATA (bukan angka contoh modul)
// dari dua build tool yang benar-benar dipakai dalam proyek:
//   - Next.js 14 (SWC + Webpack) — aplikasi utama MaternalGuard
//   - Vite 8 + Esbuild + Rolldown (Rust/Go toolchain) — mini-app ini sendiri
// Cara mengukur ulang & catatan keterbatasan perbandingan ada di
// docs/Modul8_Matriks_Benchmark_BuildTools.pdf
// ---------------------------------------------------------------------------

interface BuildMetric {
  tool: string;
  metric: string;
  value: string;
  note: string;
}

const METRICS: BuildMetric[] = [
  {
    tool: "Next.js 14 (Webpack/SWC)",
    metric: "Dev server cold start",
    value: "1318 ms",
    note: "Waktu sampai muncul 'Ready', diukur di aplikasi utama MaternalGuard",
  },
  {
    tool: "Vite 8 (Esbuild + Rolldown)",
    metric: "Dev server cold start",
    value: "205 ms",
    note: "Waktu sampai muncul 'ready', diukur di mini-app ini",
  },
  {
    tool: "Next.js 14 (Webpack/SWC)",
    metric: "Production build (clean)",
    value: "34.8 s",
    note: "npm run build, tanpa cache .next, 8 route",
  },
  {
    tool: "Vite 8 (Esbuild + Rolldown)",
    metric: "Production build (clean)",
    value: "3.5 s total (238 ms proses bundling Vite)",
    note: "npm run build (tsc -b + vite build), tanpa cache dist",
  },
];

export default function App() {
  const [renderCount, setRenderCount] = useState(0);

  return (
    <div className="page">
      <header className="page-head">
        <h1>MaternalGuard — Build Tools Lab</h1>
        <p>Modul 8: Benchmark Vite + Rust Toolchain vs Next.js (Webpack/SWC)</p>
      </header>

      <section className="card">
        <h2>Uji Interaktivitas HMR</h2>
        <p>
          Ubah teks pada <code>src/App.tsx</code> lalu simpan sambil <code>npm run dev</code>{" "}
          berjalan — perhatikan tampilan ter-update tanpa reload penuh (Vite HMR khas &lt;50ms).
        </p>
        <button type="button" onClick={() => setRenderCount((c) => c + 1)}>
          Trigger render: {renderCount}
        </button>
      </section>

      <section className="card">
        <h2>Hasil Benchmark (Diukur Langsung, Bukan Data Contoh)</h2>
        <table>
          <thead>
            <tr>
              <th>Build Tool</th>
              <th>Metrik</th>
              <th>Hasil</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => (
              <tr key={`${m.tool}-${m.metric}`}>
                <td className="tool">{m.tool}</td>
                <td>{m.metric}</td>
                <td className="value">{m.value}</td>
                <td className="note">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="caveat">
          ⚠️ Catatan jujur: Next.js MaternalGuard adalah aplikasi full-stack (Server Components,
          Route Handler, middleware auth), sedangkan mini-app ini adalah SPA sederhana. Angka bundle
          size sengaja <em>tidak</em> dibandingkan langsung karena scope aplikasinya berbeda — yang
          dibandingkan secara adil hanya waktu cold start & build tool itu sendiri, sesuai
          keterbatasan yang dijelaskan di dokumen matriks.
        </p>
      </section>
    </div>
  );
}

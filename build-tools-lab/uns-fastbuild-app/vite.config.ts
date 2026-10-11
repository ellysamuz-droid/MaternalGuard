import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Konfigurasi Teroptimasi Vite 2026 — Modul 8
// Path aliasing, dev server, dan strategi pemisahan bundel produksi (manual chunks)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  build: {
    target: "esnext",
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Bentuk fungsi dipakai supaya kompatibel lintas versi tipe Rollup;
        // secara fungsional sama dengan bentuk objek { vendor: [...] } di modul.
        manualChunks(id: string) {
          if (id.includes("node_modules") && (id.includes("/react/") || id.includes("/react-dom/"))) {
            return "vendor";
          }
        },
      },
    },
  },
});

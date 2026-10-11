"use client";

import Link from "next/link";

// Error boundary untuk halaman detail: kegagalan memanggil API tidak menjatuhkan seluruh aplikasi.
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <div className="card-body p-4">
        <h1 className="h5">Data belum dapat dimuat</h1>
        <p className="text-muted-mg">
          {error.message || "Terjadi kesalahan saat mengambil data dari server."} Coba lagi
          sebentar.
        </p>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Coba lagi
          </button>
          <Link href="/dashboard" className="btn btn-outline-primary">
            Ke dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

// Formulir GET biasa: filter berada di URL sehingga bisa dibagikan dan tidak butuh JS klien.
export default function FilterBar({
  cari,
  risiko,
  persalinan,
}: {
  cari: string;
  risiko: string;
  persalinan: string;
}) {
  return (
    <form action="/dashboard" method="get" className="row g-2 align-items-end mb-3">
      <div className="col-12 col-md-4">
        <label htmlFor="cari" className="form-label small mb-1">
          Cari nama atau nomor WhatsApp
        </label>
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-search" />
          </span>
          <input
            id="cari"
            name="cari"
            className="form-control"
            defaultValue={cari}
            placeholder="Contoh: Siti"
          />
        </div>
      </div>
      <div className="col-6 col-md-3">
        <label htmlFor="risiko" className="form-label small mb-1">
          Kategori risiko
        </label>
        <select id="risiko" name="risiko" className="form-select" defaultValue={risiko}>
          <option value="">Semua</option>
          <option value="high risk">High risk</option>
          <option value="mid risk">Mid risk</option>
          <option value="low risk">Low risk</option>
        </select>
      </div>
      <div className="col-6 col-md-3">
        <label htmlFor="persalinan" className="form-label small mb-1">
          Status persalinan
        </label>
        <select id="persalinan" name="persalinan" className="form-select" defaultValue={persalinan}>
          <option value="">Semua</option>
          <option value="belum lahir">Belum lahir</option>
          <option value="sudah lahir">Sudah lahir</option>
        </select>
      </div>
      <div className="col-12 col-md-2 d-flex gap-2">
        <button type="submit" className="btn btn-primary flex-grow-1">
          Terapkan
        </button>
        <Link href="/dashboard" className="btn btn-outline-primary" aria-label="Atur ulang filter">
          <i className="bi bi-x-lg" />
        </Link>
      </div>
    </form>
  );
}

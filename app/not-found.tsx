import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-wrap">
      <div className="card auth-card text-center p-4">
        <div className="brand-big">404</div>
        <h1 className="h4">Halaman tidak ditemukan</h1>
        <p className="text-muted-mg">
          Halaman atau data yang Anda cari tidak ada, atau bukan milik Anda.
        </p>
        <Link href="/dashboard" className="btn btn-primary">
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  );
}

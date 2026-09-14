import Link from "next/link";

export default function NotFound() {
  return (
    <div className="login-screen">
      <div className="login-card" style={{ textAlign: "center" }}>
        <h1>404</h1>
        <p className="sub">Halaman atau data pasien yang dicari tidak ditemukan.</p>
        <Link href="/dashboard" className="btn btn-primary" style={{ width: "100%" }}>
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { registrationEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string; expired?: string; terdaftar?: string };
}) {
  const from = searchParams.from ?? "/dashboard";
  const showDemo = process.env.API_MODE !== "live";
  return (
    <main className="auth-wrap">
      <div className="card auth-card">
        <div className="card-body p-4 p-md-5">
          <Link href="/" className="back-link">
            <i className="bi bi-arrow-left" /> Kembali ke beranda
          </Link>
          <div className="brand-big">MG</div>
          <h1 className="h4 text-center mb-1">MaternalGuard</h1>
          <p className="text-center text-muted-mg mb-4">
            Masuk untuk memantau ibu hamil binaan Anda.
          </p>
          {searchParams.expired ? (
            <div className="alert mg-alert pink small" role="status">
              Sesi Anda berakhir. Silakan masuk kembali.
            </div>
          ) : null}
          {searchParams.terdaftar ? (
            <div className="alert mg-alert small" role="status">
              <i className="bi bi-check-circle me-2" />
              Akun berhasil dibuat. Silakan masuk.
            </div>
          ) : null}
          <LoginForm from={from} showDemo={showDemo} />
          {registrationEnabled() ? (
            <p className="text-center small text-muted-mg mt-4 mb-0">
              Belum punya akun? <Link href="/daftar">Daftar sebagai bidan</Link>
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

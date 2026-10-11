import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DaftarForm from "@/components/auth/DaftarForm";
import { registrationEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Daftar Bidan" };

export default function DaftarPage() {
  if (!registrationEnabled()) notFound();
  return (
    <main className="auth-wrap">
      <div className="card auth-card" style={{ maxWidth: 640 }}>
        <div className="card-body p-4 p-md-5">
          <Link href="/" className="back-link">
            <i className="bi bi-arrow-left" /> Kembali ke beranda
          </Link>
          <div className="brand-big">MG</div>
          <h1 className="h4 text-center mb-1">Daftar sebagai bidan</h1>
          <p className="text-center text-muted-mg mb-4">
            Buat akun untuk mulai mencatat dan memantau ibu hamil binaan Anda.
          </p>
          <DaftarForm />
          <p className="text-center small text-muted-mg mt-4 mb-0">
            Sudah punya akun? <Link href="/login">Masuk</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

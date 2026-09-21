import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";
import { getPatients } from "@/lib/data";

export const metadata: Metadata = {
  title: "Daftar Akun Ibu Hamil",
  description: "Registrasi akun Ibu Hamil untuk memantau kehamilan mandiri di MaternalGuard.",
};

// FR-01: Registrasi Akun. Daftar pasien diambil dari data bidan (lib/data.ts)
// karena pada SRS, akun Ibu Hamil ditautkan ke satu rekam pasien yang sudah
// terdaftar di puskesmas (bukan membuat rekam medis baru dari nol saat
// registrasi mandiri) — sesuai NFR-06 (least privilege / data terverifikasi).
export default async function RegisterPage() {
  const patients = await getPatients();

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand">
          <span className="mark">MG</span>
          MaternalGuard
        </div>
        <h1>Daftar Akun Ibu Hamil</h1>
        <p className="sub">
          Pantau tekanan darah, keluhan, dan risiko kehamilanmu setiap hari dari rumah.
        </p>
        <RegisterForm patients={patients.map((p) => ({ id: p.id, name: p.name }))} />
        <p className="hint">
          Sudah punya akun? <Link href="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}

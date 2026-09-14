import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk sebagai bidan/dokter pendamping untuk memantau pasien binaan MaternalGuard.",
};

// Server Component: hanya merender cangkang halaman + men-delegasikan seluruh
// interaktivitas (input terkontrol, submit, error state) ke Client Component
// daun `LoginForm`, sesuai poin (c) — isolasi komponen klien.
export default function LoginPage() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand">
          <span className="mark">MG</span>
          MaternalGuard
        </div>
        <h1>Masuk ke Dashboard</h1>
        <p className="sub">Khusus akun bidan/dokter pendamping pasien binaan.</p>
        <LoginForm />
        <p className="hint">
          Demo: <code>bidan@maternalguard.id</code> / <code>puskesmas123</code>
        </p>
      </div>
    </div>
  );
}

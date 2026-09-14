import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { getSession } from "@/lib/session";

// Poin (d) — Nested Layout kedua (di bawah Root Layout di app/layout.tsx).
// Layout ini dibagikan oleh SEMUA rute privat: /dashboard, /pasien/[id], dan
// /periksa/[id]. Karena Next.js hanya me-render ulang `children`-nya saat
// berpindah rute di dalam grup ini, <Sidebar> (beserta state internal
// NavLinks/LogoutButton) TIDAK di-remount — state UI-nya (mis. hover, fokus)
// tetap terjaga selama navigasi antar halaman privat.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/login");

  return (
    <div className="app-shell">
      <Sidebar session={session} />
      <main className="main">{children}</main>
    </div>
  );
}

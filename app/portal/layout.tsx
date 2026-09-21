import { redirect } from "next/navigation";
import PortalSidebar from "@/components/layout/PortalSidebar";
import { getSession } from "@/lib/session";

// NFR-06 (least privilege): halaman ini hanya untuk role ibu_hamil.
// Middleware sudah menolak akses tanpa sesi/role yang salah lebih awal,
// pengecekan di sini adalah lapisan kedua (defense in depth).
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "ibu_hamil") redirect("/dashboard");

  return (
    <div className="app-shell">
      <PortalSidebar session={session} />
      <main className="main">{children}</main>
    </div>
  );
}

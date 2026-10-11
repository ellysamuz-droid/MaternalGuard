import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getSession } from "@/lib/session";

// Layout bersarang: sidebar dipertahankan lintas halaman. Middleware sudah
// memblokir akses tanpa token, pemeriksaan ini hanya sebagai lapis kedua.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/logout?expired=1");
  return <AppShell nama={session.nama}>{children}</AppShell>;
}

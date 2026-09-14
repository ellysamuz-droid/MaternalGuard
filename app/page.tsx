import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// Server Component murni: tidak ada UI, hanya menentukan tujuan redirect
// berdasarkan sesi. Middleware sudah menjaga /dashboard, tapi redirect di
// sini membuat "/" langsung mengarahkan pengguna tanpa flash konten kosong.
export default function RootPage() {
  const session = getSession();
  redirect(session ? "/dashboard" : "/login");
}

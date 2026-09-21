import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listNotifications } from "@/lib/vitalStore";

// GET /api/notifications            -> semua notifikasi (khusus role bidan)
// GET /api/notifications?patientId=B -> notifikasi milik satu pasien
export async function GET(request: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const patientId = request.nextUrl.searchParams.get("patientId") ?? undefined;

  // NFR-06: ibu_hamil hanya boleh melihat notifikasi miliknya sendiri.
  if (session.role === "ibu_hamil") {
    if (patientId && patientId !== session.patientId) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }
    const data = await listNotifications(session.patientId);
    return NextResponse.json(data);
  }

  // Bidan boleh melihat semua, atau difilter per pasien.
  const data = await listNotifications(patientId);
  return NextResponse.json(data);
}

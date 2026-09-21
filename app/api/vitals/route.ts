import { type NextRequest, NextResponse } from "next/server";
import { CreateVitalInputSchema } from "@/lib/schemas/vital";
import { getSession } from "@/lib/session";
import { createVital, listVitals } from "@/lib/vitalStore";

function assertOwnsPatient(patientId: string): NextResponse | null {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  // NFR-06: least privilege — ibu_hamil hanya boleh akses data miliknya sendiri.
  if (session.role === "ibu_hamil" && session.patientId !== patientId) {
    return NextResponse.json(
      { error: "Tidak diizinkan mengakses data pasien lain" },
      { status: 403 },
    );
  }
  return null;
}

// GET /api/vitals?patientId=B
export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId wajib diisi" }, { status: 400 });
  }
  const denied = assertOwnsPatient(patientId);
  if (denied) return denied;

  const data = await listVitals(patientId);
  return NextResponse.json(data);
}

// POST /api/vitals — FR-04 input vital harian + FR-05 checklist keluhan
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CreateVitalInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const denied = assertOwnsPatient(parsed.data.patientId);
  if (denied) return denied;

  const result = await createVital(parsed.data);
  return NextResponse.json(result, { status: 201 });
}

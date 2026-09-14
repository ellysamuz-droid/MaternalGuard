import { NextRequest, NextResponse } from "next/server";
import { CreateFollowUpNoteSchema } from "@/lib/schemas/followup";
import { createNote, listNotes } from "@/lib/followupStore";

// GET /api/catatan?patientId=B
// Endpoint REST asli yang di-fetch oleh TanStack Query dari Client Component
// (lib/client-api/followupApi.ts) — sengaja terpisah dari lib/data.ts (yang
// dipakai RSC Modul 6) supaya "Server State" di sini benar-benar melalui
// siklus HTTP request/response, bukan pemanggilan fungsi langsung.
export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId wajib diisi" }, { status: 400 });
  }
  const notes = await listNotes(patientId);
  return NextResponse.json(notes);
}

// POST /api/catatan
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CreateFollowUpNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const created = await createNote(parsed.data);
  return NextResponse.json(created, { status: 201 });
}

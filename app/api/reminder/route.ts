import { type NextRequest, NextResponse } from "next/server";
import { createReminder, listReminders } from "@/lib/followupStore";
import { CreateReminderSchema } from "@/lib/schemas/followup";

// GET /api/reminder?patientId=B
export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId wajib diisi" }, { status: 400 });
  }
  const reminders = await listReminders(patientId);
  return NextResponse.json(reminders);
}

// POST /api/reminder
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CreateReminderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const created = await createReminder(parsed.data);
  return NextResponse.json(created, { status: 201 });
}

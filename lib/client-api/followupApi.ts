import { z } from "zod";
import {
  type CreateFollowUpNoteInput,
  type CreateReminderInput,
  type FollowUpNote,
  FollowUpNoteSchema,
  type Reminder,
  ReminderSchema,
} from "../schemas/followup";

// ---------------------------------------------------------------------------
// Layer ini HANYA dipanggil dari Client Component (lewat hooks di
// hooks/useFollowUpQuery.ts). Setiap respons REST divalidasi ulang dengan
// Zod di runtime (`.parse`) sebelum masuk ke cache TanStack Query — menjamin
// End-to-End Type Safety walau bentuk JSON dari server berubah diam-diam.
// ---------------------------------------------------------------------------

async function parseJsonOrThrow(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? fallbackMessage);
  }
  return response.json();
}

export async function fetchFollowUpNotes(patientId: string): Promise<FollowUpNote[]> {
  const res = await fetch(`/api/catatan?patientId=${encodeURIComponent(patientId)}`);
  const raw = await parseJsonOrThrow(res, "Gagal mengambil catatan tindak lanjut");
  return z.array(FollowUpNoteSchema).parse(raw);
}

export async function postFollowUpNote(input: CreateFollowUpNoteInput): Promise<FollowUpNote> {
  const res = await fetch(`/api/catatan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const raw = await parseJsonOrThrow(res, "Gagal menyimpan catatan tindak lanjut");
  return FollowUpNoteSchema.parse(raw);
}

export async function fetchReminders(patientId: string): Promise<Reminder[]> {
  const res = await fetch(`/api/reminder?patientId=${encodeURIComponent(patientId)}`);
  const raw = await parseJsonOrThrow(res, "Gagal mengambil pengingat kontrol");
  return z.array(ReminderSchema).parse(raw);
}

export async function postReminder(input: CreateReminderInput): Promise<Reminder> {
  const res = await fetch(`/api/reminder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const raw = await parseJsonOrThrow(res, "Gagal menyimpan pengingat kontrol");
  return ReminderSchema.parse(raw);
}

import "server-only";
import type {
  CreateFollowUpNoteInput,
  CreateReminderInput,
  FollowUpNote,
  Reminder,
} from "./schemas/followup";

// ---------------------------------------------------------------------------
// "Database" tiruan khusus untuk REST API Route Handler (app/api/**).
// Ditandai `server-only` — hanya boleh diimpor dari Route Handler, TIDAK
// PERNAH dari Client Component. Client mengaksesnya lewat HTTP fetch biasa
// (lib/client-api/followupApi.ts), lalu TanStack Query yang mengelola cache-nya.
// ---------------------------------------------------------------------------

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let notes: FollowUpNote[] = [
  {
    id: "n1",
    patientId: "B",
    note: "Sudah dihubungi via telepon, mengeluh sakit kepala masih ada. Disarankan datang hari ini.",
    status: "Pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: "n2",
    patientId: "B",
    note: "Kunjungan rumah dilakukan, tekanan darah dipantau, keluarga sudah paham tanda bahaya.",
    status: "Selesai",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

let reminders: Reminder[] = [
  {
    id: "r1",
    patientId: "B",
    tanggal: "2026-09-22",
    jenisPemeriksaan: "Kontrol rutin",
    terkirim: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
];

export async function listNotes(patientId: string): Promise<FollowUpNote[]> {
  const data = notes
    .filter((n) => n.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return delay(data, 600);
}

export async function createNote(input: CreateFollowUpNoteInput): Promise<FollowUpNote> {
  const created: FollowUpNote = {
    id: `n${notes.length + 1}-${Date.now()}`,
    patientId: input.patientId,
    note: input.note,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
  notes = [created, ...notes];
  return delay(created, 500);
}

export async function listReminders(patientId: string): Promise<Reminder[]> {
  const data = reminders
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  return delay(data, 750);
}

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const created: Reminder = {
    id: `r${reminders.length + 1}-${Date.now()}`,
    patientId: input.patientId,
    tanggal: input.tanggal,
    jenisPemeriksaan: input.jenisPemeriksaan,
    terkirim: false,
    createdAt: new Date().toISOString(),
  };
  reminders = [...reminders, created];
  return delay(created, 500);
}

import { z } from "zod";
import {
  type AppNotification,
  AppNotificationSchema,
  type CreateVitalInput,
  CreateVitalInputSchema,
  CreateVitalResponseSchema,
  type VitalEntry,
  VitalEntrySchema,
} from "../schemas/vital";

async function parseJsonOrThrow(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? fallbackMessage);
  }
  return response.json();
}

export async function fetchVitals(patientId: string): Promise<VitalEntry[]> {
  const res = await fetch(`/api/vitals?patientId=${encodeURIComponent(patientId)}`);
  const raw = await parseJsonOrThrow(res, "Gagal mengambil riwayat data vital");
  return z.array(VitalEntrySchema).parse(raw);
}

export async function postVital(input: CreateVitalInput) {
  CreateVitalInputSchema.parse(input); // validasi sisi client sebelum dikirim
  const res = await fetch(`/api/vitals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const raw = await parseJsonOrThrow(res, "Gagal menyimpan data vital");
  return CreateVitalResponseSchema.parse(raw);
}

export async function fetchNotifications(patientId: string): Promise<AppNotification[]> {
  const res = await fetch(`/api/notifications?patientId=${encodeURIComponent(patientId)}`);
  const raw = await parseJsonOrThrow(res, "Gagal mengambil notifikasi");
  return z.array(AppNotificationSchema).parse(raw);
}

/** FR-09 (sisi Bidan): semua notifikasi early warning dari seluruh pasien binaan. */
export async function fetchAllNotifications(): Promise<AppNotification[]> {
  const res = await fetch("/api/notifications");
  const raw = await parseJsonOrThrow(res, "Gagal mengambil notifikasi");
  return z.array(AppNotificationSchema).parse(raw);
}

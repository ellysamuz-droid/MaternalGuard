import "server-only";
import { getPatient, getPatientHistory } from "./data";
import { computeRiskBreakdown } from "./riskScore";
import type { AppNotification, RiskBreakdown, SymptomKey, VitalEntry } from "./types";

// ---------------------------------------------------------------------------
// "Database" tiruan untuk data yang diinput MANDIRI oleh Ibu Hamil (FR-04,
// FR-05) beserta notifikasi early warning turunannya (FR-09). Hanya boleh
// diimpor dari Route Handler (app/api/**), tidak pernah dari Client Component.
// ---------------------------------------------------------------------------

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let vitals: VitalEntry[] = [];
let notifications: AppNotification[] = [];

export async function listVitals(patientId: string): Promise<VitalEntry[]> {
  const data = vitals
    .filter((v) => v.patientId === patientId)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return delay(data, 400);
}

/** FR-06: baseline = rata-rata sistolik 7-14 hari terakhir (riwayat pemeriksaan bidan + input mandiri). */
async function computeBaselineSistolik(patientId: string): Promise<number> {
  const [history, ownVitals] = await Promise.all([
    getPatientHistory(patientId),
    listVitals(patientId),
  ]);
  const sistolikValues = [
    ...history.map((h) => h.sistolik),
    ...ownVitals.map((v) => v.sistolik),
  ].slice(-14);
  if (sistolikValues.length === 0) return 0;
  return sistolikValues.reduce((a, b) => a + b, 0) / sistolikValues.length;
}

export interface CreateVitalInput {
  patientId: string;
  tanggal: string;
  sistolik: number;
  diastolik: number;
  nadi: number;
  berat: number;
  keluhan: SymptomKey[];
}

export async function createVital(
  input: CreateVitalInput,
): Promise<{ entry: VitalEntry; risk: RiskBreakdown; notification: AppNotification | null }> {
  const [patient, baselineSistolik] = await Promise.all([
    getPatient(input.patientId),
    computeBaselineSistolik(input.patientId),
  ]);

  const risk = computeRiskBreakdown({
    latestSistolik: input.sistolik,
    baselineSistolik: baselineSistolik || input.sistolik,
    keluhan: input.keluhan,
    riwayatPreeklamsia: patient?.riwayatPreeklamsia ?? false,
  });

  const entry: VitalEntry = {
    id: `v-${Date.now()}`,
    patientId: input.patientId,
    tanggal: input.tanggal,
    sistolik: input.sistolik,
    diastolik: input.diastolik,
    nadi: input.nadi,
    berat: input.berat,
    keluhan: input.keluhan,
    createdAt: new Date().toISOString(),
  };
  vitals = [entry, ...vitals];

  // FR-09: notifikasi early warning otomatis saat risk terklasifikasi sedang/tinggi.
  let notification: AppNotification | null = null;
  if (risk.level === "sedang" || risk.level === "tinggi") {
    notification = {
      id: `notif-${Date.now()}`,
      patientId: input.patientId,
      level: risk.level,
      message:
        risk.level === "tinggi"
          ? `${patient?.name ?? input.patientId}: risiko TINGGI terdeteksi (skor ${risk.weightedScore}). Segera hubungi/kunjungi.`
          : `${patient?.name ?? input.patientId}: risiko SEDANG terdeteksi (skor ${risk.weightedScore}). Perlu dipantau.`,
      createdAt: new Date().toISOString(),
    };
    notifications = [notification, ...notifications];
  }

  return delay({ entry, risk, notification }, 700);
}

/** Dipakai dashboard Bidan (semua pasien) maupun portal Ibu Hamil (patientId spesifik). */
export async function listNotifications(patientId?: string): Promise<AppNotification[]> {
  const data = patientId ? notifications.filter((n) => n.patientId === patientId) : notifications;
  return delay(
    data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    300,
  );
}

/** FR-13: true jika pasien BELUM input data pada tanggal (default: hari ini). */
export async function hasInputToday(patientId: string, todayIso: string): Promise<boolean> {
  const data = await listVitals(patientId);
  return data.some((v) => v.tanggal === todayIso);
}

import "server-only";
import { cache } from "react";
import type { HistoryEntry, Patient } from "./types";

// ---------------------------------------------------------------------------
// Lapisan data tiruan (menggantikan panggilan ke REST API / PostgreSQL nyata
// sebagaimana dijelaskan pada SRS Bab V & VI). Sengaja diberi delay untuk
// mendemonstrasikan Streaming SSR + <Suspense> + loading.tsx pada komponen
// yang memanggilnya. Ditandai `server-only` supaya modul ini TIDAK PERNAH
// bisa diimpor dari Client Component / bundle browser.
// ---------------------------------------------------------------------------

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const PATIENTS: Patient[] = [
  {
    id: "B",
    name: "Ibu B",
    age: 29,
    week: 32,
    sistolik: 142,
    diastolik: 92,
    status: "tinggi",
    complaint: "sakit kepala hebat, pandangan kabur",
    riskScore: 78,
    puskesmas: "Puskesmas Manguharjo",
    riwayatPreeklamsia: false,
  },
  {
    id: "C",
    name: "Ibu C",
    age: 27,
    week: 28,
    sistolik: 132,
    diastolik: 86,
    status: "sedang",
    complaint: "tren naik 3 hari berturut",
    riskScore: 54,
    puskesmas: "Puskesmas Manguharjo",
    riwayatPreeklamsia: false,
  },
  {
    id: "D",
    name: "Ibu D",
    age: 24,
    week: 20,
    sistolik: 118,
    diastolik: 78,
    status: "rendah",
    complaint: "-",
    riskScore: 18,
    puskesmas: "Puskesmas Manguharjo",
    riwayatPreeklamsia: false,
  },
  {
    id: "E",
    name: "Ibu E",
    age: 31,
    week: 24,
    sistolik: 124,
    diastolik: 80,
    status: "rendah",
    complaint: "-",
    riskScore: 22,
    puskesmas: "Puskesmas Manguharjo",
    riwayatPreeklamsia: true,
  },
  {
    id: "F",
    name: "Ibu F",
    age: 26,
    week: 30,
    sistolik: 136,
    diastolik: 88,
    status: "sedang",
    complaint: "-",
    riskScore: 47,
    puskesmas: "Puskesmas Manguharjo",
    riwayatPreeklamsia: false,
  },
];

const HISTORY: Record<string, HistoryEntry[]> = {
  B: [
    { date: "14 Agu", sistolik: 118, diastolik: 76, complaint: "Tidak ada", severity: "none" },
    { date: "15 Agu", sistolik: 120, diastolik: 77, complaint: "Tidak ada", severity: "none" },
    { date: "16 Agu", sistolik: 122, diastolik: 78, complaint: "Tidak ada", severity: "none" },
    { date: "17 Agu", sistolik: 126, diastolik: 80, complaint: "Sedikit pusing", severity: "mild" },
    {
      date: "18 Agu",
      sistolik: 131,
      diastolik: 84,
      complaint: "Pusing, kaki sedikit bengkak",
      severity: "mild",
    },
    {
      date: "19 Agu",
      sistolik: 136,
      diastolik: 88,
      complaint: "Sakit kepala, kaki bengkak",
      severity: "severe",
    },
    {
      date: "20 Agu",
      sistolik: 142,
      diastolik: 92,
      complaint: "Sakit kepala hebat, pandangan kabur",
      severity: "severe",
    },
  ],
};

export async function getPatients(ms = 700): Promise<Patient[]> {
  return delay(PATIENTS, ms);
}

export const getPatient = cache(async (id: string): Promise<Patient | null> => {
  const found = PATIENTS.find((p) => p.id === id) ?? null;
  return delay(found, 500);
});

export async function getPatientHistory(id: string): Promise<HistoryEntry[]> {
  return delay(HISTORY[id] ?? [], 1100);
}

export async function getDashboardStats() {
  const patients = await getPatients();
  return {
    total: patients.length,
    tinggi: patients.filter((p) => p.status === "tinggi").length,
    sedang: patients.filter((p) => p.status === "sedang").length,
    rendah: patients.filter((p) => p.status === "rendah").length,
  };
}

export async function submitExamResult(payload: Record<string, unknown>) {
  await delay(null, 900);
  return { ok: true, savedAt: new Date().toISOString(), data: payload };
}

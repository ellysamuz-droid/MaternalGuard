export type RiskLevel = "tinggi" | "sedang" | "rendah";

export interface Patient {
  id: string;
  name: string;
  age: number;
  week: number;
  sistolik: number;
  diastolik: number;
  status: RiskLevel;
  complaint: string;
  riskScore: number;
  puskesmas: string;
  riwayatPreeklamsia: boolean;
}

export interface HistoryEntry {
  date: string;
  sistolik: number;
  diastolik: number;
  complaint: string;
  severity: "none" | "mild" | "severe";
}

export interface Session {
  userId: string;
  name: string;
  role: "bidan" | "ibu_hamil";
  puskesmas: string;
  /** Hanya ada untuk role ibu_hamil — menautkan akun ke satu rekam pasien (NFR-06: least privilege). */
  patientId?: string;
}

// --- FR-03/04/05: Input mandiri oleh Ibu Hamil -----------------------------

export const SYMPTOM_KEYS = [
  "sakit_kepala",
  "pandangan_kabur",
  "edema",
  "mual",
  "gerakan_janin_berkurang",
  "nyeri_ulu_hati",
] as const;
export type SymptomKey = (typeof SYMPTOM_KEYS)[number];

export const SYMPTOM_LABELS: Record<SymptomKey, string> = {
  sakit_kepala: "Sakit kepala",
  pandangan_kabur: "Pandangan kabur",
  edema: "Bengkak di kaki/tangan (edema)",
  mual: "Mual/muntah berlebihan",
  gerakan_janin_berkurang: "Gerakan janin berkurang",
  nyeri_ulu_hati: "Nyeri ulu hati",
};

export interface VitalEntry {
  id: string;
  patientId: string;
  tanggal: string; // ISO date (yyyy-mm-dd)
  sistolik: number;
  diastolik: number;
  nadi: number;
  berat: number;
  keluhan: SymptomKey[];
  createdAt: string;
}

// --- FR-06/07/08: Weighted Risk Score --------------------------------------

export interface RiskBreakdown {
  trendScore: number;
  symptomScore: number;
  historyScore: number;
  weightedScore: number;
  level: RiskLevel;
}

// --- FR-09/13: Notifikasi (in-app, pengganti push notification asli) ------

export interface AppNotification {
  id: string;
  patientId: string;
  level: RiskLevel;
  message: string;
  createdAt: string;
}

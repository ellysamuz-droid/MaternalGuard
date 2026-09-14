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
  role: "bidan";
  puskesmas: string;
}

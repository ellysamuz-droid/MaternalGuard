import type { RiskBreakdown, RiskLevel, SymptomKey } from "./types";

// ---------------------------------------------------------------------------
// Mesin Weighted Risk Score — implementasi SRS FR-06, FR-07, FR-08.
// Fungsi murni (pure function), tanpa I/O, sehingga mudah diuji unit test
// terpisah dari lapisan data/API (lihat lib/vitalStore.ts untuk pemanggilnya).
// ---------------------------------------------------------------------------

/** FR-07: Bobot tiap jenis keluhan (skala 0-100 kontribusi maksimum gabungan). */
export const SYMPTOM_WEIGHTS: Record<SymptomKey, number> = {
  gerakan_janin_berkurang: 30, // tanda bahaya paling kritis
  pandangan_kabur: 25,
  sakit_kepala: 20,
  nyeri_ulu_hati: 15,
  edema: 10,
  mual: 5,
};

/**
 * FR-06: Trend Score — membandingkan tekanan sistolik terbaru terhadap
 * baseline rata-rata 7-14 hari terakhir. Kenaikan signifikan dari baseline
 * dianggap sinyal risiko meski nilai absolutnya belum "tinggi".
 */
export function calculateTrendScore(latestSistolik: number, baselineSistolik: number): number {
  if (baselineSistolik <= 0) return 0;
  const deltaPercent = ((latestSistolik - baselineSistolik) / baselineSistolik) * 100;
  // Kenaikan 0% -> skor 0; kenaikan >=20% dari baseline -> skor maksimum 100.
  const score = (deltaPercent / 20) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** FR-07: Symptom Score — jumlah bobot keluhan yang dipilih, dibatasi 0-100. */
export function calculateSymptomScore(keluhan: SymptomKey[]): number {
  const total = keluhan.reduce((sum, key) => sum + (SYMPTOM_WEIGHTS[key] ?? 0), 0);
  return Math.max(0, Math.min(100, total));
}

/** Kontribusi riwayat medis (mis. riwayat preeklamsia) terhadap skor akhir. */
export function calculateHistoryScore(riwayatPreeklamsia: boolean): number {
  return riwayatPreeklamsia ? 60 : 0;
}

/**
 * FR-08: Weighted Risk Score — menggabungkan ketiga skor di atas dengan bobot
 * 50% trend, 35% gejala, 15% riwayat, lalu mengklasifikasikannya.
 * Ambang batas (35 / 65) diselaraskan dengan data contoh pasien pada modul
 * sebelumnya (Ibu B=78 tinggi, Ibu C=54 sedang, Ibu D=18 rendah, dst).
 */
export function calculateWeightedRiskScore(input: {
  trendScore: number;
  symptomScore: number;
  historyScore: number;
}): number {
  const { trendScore, symptomScore, historyScore } = input;
  const weighted = trendScore * 0.5 + symptomScore * 0.35 + historyScore * 0.15;
  return Math.round(Math.max(0, Math.min(100, weighted)));
}

export function classifyRiskLevel(weightedScore: number): RiskLevel {
  if (weightedScore >= 65) return "tinggi";
  if (weightedScore >= 35) return "sedang";
  return "rendah";
}

/** Fungsi gabungan yang dipakai lib/vitalStore.ts saat memproses input baru. */
export function computeRiskBreakdown(params: {
  latestSistolik: number;
  baselineSistolik: number;
  keluhan: SymptomKey[];
  riwayatPreeklamsia: boolean;
}): RiskBreakdown {
  const trendScore = calculateTrendScore(params.latestSistolik, params.baselineSistolik);
  const symptomScore = calculateSymptomScore(params.keluhan);
  const historyScore = calculateHistoryScore(params.riwayatPreeklamsia);
  const weightedScore = calculateWeightedRiskScore({ trendScore, symptomScore, historyScore });
  const level = classifyRiskLevel(weightedScore);
  return { trendScore, symptomScore, historyScore, weightedScore, level };
}

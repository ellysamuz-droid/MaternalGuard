import { z } from "zod";
import { SYMPTOM_KEYS } from "../types";

export const SymptomKeySchema = z.enum(SYMPTOM_KEYS);

export const VitalEntrySchema = z.object({
  id: z.string(),
  patientId: z.string().min(1),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  sistolik: z.number().int().min(60, "Sistolik tidak valid").max(260, "Sistolik tidak valid"),
  diastolik: z.number().int().min(40, "Diastolik tidak valid").max(180, "Diastolik tidak valid"),
  nadi: z.number().int().min(30, "Nadi tidak valid").max(220, "Nadi tidak valid"),
  berat: z.number().min(30, "Berat tidak valid").max(200, "Berat tidak valid"),
  keluhan: z.array(SymptomKeySchema),
  createdAt: z.string(),
});

export const CreateVitalInputSchema = VitalEntrySchema.omit({ id: true, createdAt: true });
export type CreateVitalInput = z.infer<typeof CreateVitalInputSchema>;
export type VitalEntry = z.infer<typeof VitalEntrySchema>;

export const RiskBreakdownSchema = z.object({
  trendScore: z.number(),
  symptomScore: z.number(),
  historyScore: z.number(),
  weightedScore: z.number(),
  level: z.enum(["tinggi", "sedang", "rendah"]),
});
export type RiskBreakdown = z.infer<typeof RiskBreakdownSchema>;

export const AppNotificationSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  level: z.enum(["tinggi", "sedang", "rendah"]),
  message: z.string(),
  createdAt: z.string(),
});
export type AppNotification = z.infer<typeof AppNotificationSchema>;

export const CreateVitalResponseSchema = z.object({
  entry: VitalEntrySchema,
  risk: RiskBreakdownSchema,
  notification: AppNotificationSchema.nullable(),
});

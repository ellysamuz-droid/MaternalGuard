"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFollowUpNotes,
  fetchReminders,
  postFollowUpNote,
  postReminder,
} from "@/lib/client-api/followupApi";
import type { CreateFollowUpNoteInput, CreateReminderInput } from "@/lib/schemas/followup";

// Query key factory — terstruktur per entitas + parameter, memudahkan
// invalidasi presisi (mis. hanya invalidasi catatan milik 1 pasien).
export const followUpKeys = {
  notes: (patientId: string) => ["catatan", patientId] as const,
  reminders: (patientId: string) => ["reminder", patientId] as const,
};

// Entitas 1 — Catatan Tindak Lanjut: bidan bisa menambah catatan kapan saja
// di lapangan, jadi data dianggap "basi" cukup cepat (1 menit) supaya bidan
// lain yang membuka pasien yang sama tidak lihat data lama terlalu lama.
export function useFollowUpNotesQuery(patientId: string) {
  return useQuery({
    queryKey: followUpKeys.notes(patientId),
    queryFn: () => fetchFollowUpNotes(patientId),
    staleTime: 1000 * 60 * 1, // 1 menit
    gcTime: 1000 * 60 * 10, // 10 menit
  });
}

export function useCreateFollowUpNoteMutation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFollowUpNoteInput) => postFollowUpNote(input),
    onSuccess: () => {
      // Invalidasi presisi: hanya cache catatan milik pasien ini yang di-refetch.
      queryClient.invalidateQueries({ queryKey: followUpKeys.notes(patientId) });
    },
  });
}

// Entitas 2 — Pengingat Kontrol: jadwal kontrol jarang berubah dalam jangka
// pendek, jadi staleTime dibuat lebih panjang (5 menit) untuk mengurangi
// request berulang saat bidan bolak-balik antar tab.
export function useRemindersQuery(patientId: string) {
  return useQuery({
    queryKey: followUpKeys.reminders(patientId),
    queryFn: () => fetchReminders(patientId),
    staleTime: 1000 * 60 * 5, // 5 menit
    gcTime: 1000 * 60 * 15, // 15 menit
  });
}

export function useCreateReminderMutation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReminderInput) => postReminder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followUpKeys.reminders(patientId) });
    },
  });
}

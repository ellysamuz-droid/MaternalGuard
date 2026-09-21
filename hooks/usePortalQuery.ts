"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllNotifications,
  fetchNotifications,
  fetchVitals,
  postVital,
} from "@/lib/client-api/portalApi";
import type { CreateVitalInput } from "@/lib/schemas/vital";

export const portalKeys = {
  vitals: (patientId: string) => ["vitals", patientId] as const,
  notifications: (patientId: string) => ["notifications", patientId] as const,
  allNotifications: () => ["notifications", "all"] as const,
};

export function useVitalsQuery(patientId: string) {
  return useQuery({
    queryKey: portalKeys.vitals(patientId),
    queryFn: () => fetchVitals(patientId),
    staleTime: 1000 * 60, // 1 menit — data harian, cukup sering berubah
    gcTime: 1000 * 60 * 10,
  });
}

export function useNotificationsQuery(patientId: string) {
  return useQuery({
    queryKey: portalKeys.notifications(patientId),
    queryFn: () => fetchNotifications(patientId),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });
}

/** FR-09 (sisi Bidan): dipoll berkala supaya peringatan dini terasa "real-time" tanpa push notification asli. */
export function useAllNotificationsQuery() {
  return useQuery({
    queryKey: portalKeys.allNotifications(),
    queryFn: () => fetchAllNotifications(),
    staleTime: 1000 * 20,
    refetchInterval: 1000 * 30,
  });
}

export function useCreateVitalMutation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVitalInput) => postVital(input),
    onSuccess: () => {
      // FR-06/07/08/09: entri baru mengubah baseline & bisa memicu notifikasi baru.
      queryClient.invalidateQueries({ queryKey: portalKeys.vitals(patientId) });
      queryClient.invalidateQueries({ queryKey: portalKeys.notifications(patientId) });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JadwalPesan, RiwayatNotifikasi, StatusJadwal } from "@/lib/api/types";
import { bff } from "@/lib/clientApi";

/**
 * Riwayat notifikasi (FR-10). Status pengiriman berubah lewat webhook, jadi
 * selama masih ada baris menunggu/terkirim, data diambil ulang tiap 5 detik.
 */
export function useNotifikasiQuery(idIbu: number) {
  return useQuery({
    queryKey: ["notifikasi", idIbu],
    queryFn: () => bff<RiwayatNotifikasi[]>(`/ibu-hamil/${idIbu}/notifikasi`),
    refetchInterval: (q) => {
      const rows = q.state.data;
      const berjalan = rows?.some(
        (r) => r.status_kirim === "menunggu" || r.status_kirim === "terkirim",
      );
      return berjalan ? 5000 : false;
    },
    staleTime: 0,
  });
}

export function useJadwalQuery(idIbu: number) {
  return useQuery({
    queryKey: ["jadwal", idIbu],
    queryFn: () => bff<JadwalPesan[]>(`/ibu-hamil/${idIbu}/jadwal-pesan`),
    staleTime: 0,
  });
}

/** FR-12: jeda atau aktifkan kembali jadwal pesan. */
export function useUbahJadwalMutation(idIbu: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { idJadwal: number; status: Extract<StatusJadwal, "aktif" | "dijeda"> }) =>
      bff<JadwalPesan>(`/jadwal-pesan/${v.idJadwal}`, {
        method: "PATCH",
        body: { status: v.status },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jadwal", idIbu] }),
  });
}

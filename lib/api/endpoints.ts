import "server-only";
import { apiFetch } from "./server";
import type {
  HasilLab,
  HasilPencatatan,
  IbuHamil,
  JadwalPesan,
  JenisKeluhan,
  LoginResult,
  Pemeriksaan,
  RiwayatNotifikasi,
} from "./types";

// Fungsi bertipe untuk tiap endpoint di Bagian 9 dokumen.

export const login = (email: string, password: string) =>
  apiFetch<LoginResult>("POST", "/auth/login", { body: { email, password }, token: null });

export const getIbuHamilList = (
  q: { cari?: string; status_risiko?: string; status_persalinan?: string } = {},
) => apiFetch<IbuHamil[]>("GET", "/ibu-hamil", { query: q });
export const getIbuHamil = (id: number) => apiFetch<IbuHamil>("GET", `/ibu-hamil/${id}`);
export const createIbuHamil = (body: unknown) => apiFetch<IbuHamil>("POST", "/ibu-hamil", { body });
export const updateIbuHamil = (id: number, body: unknown) =>
  apiFetch<IbuHamil>("PUT", `/ibu-hamil/${id}`, { body });
export const setStatusPersalinan = (id: number, body: unknown) =>
  apiFetch<IbuHamil>("PATCH", `/ibu-hamil/${id}/status-persalinan`, { body });

export const getPemeriksaan = (id: number) =>
  apiFetch<Pemeriksaan[]>("GET", `/ibu-hamil/${id}/pemeriksaan`);
export const createPemeriksaan = (id: number, body: unknown) =>
  apiFetch<HasilPencatatan>("POST", `/ibu-hamil/${id}/pemeriksaan`, { body });

export const getHasilLab = (id: number) =>
  apiFetch<HasilLab[]>("GET", `/ibu-hamil/${id}/hasil-lab`);
export const createHasilLab = (id: number, body: unknown) =>
  apiFetch<HasilLab>("POST", `/ibu-hamil/${id}/hasil-lab`, { body });

export const getNotifikasi = (id: number) =>
  apiFetch<RiwayatNotifikasi[]>("GET", `/ibu-hamil/${id}/notifikasi`);
export const getJadwalPesan = (id: number) =>
  apiFetch<JadwalPesan[]>("GET", `/ibu-hamil/${id}/jadwal-pesan`);
export const getJenisKeluhan = () => apiFetch<JenisKeluhan[]>("GET", "/jenis-keluhan");

import { create } from "zustand";

export type DetailTab = "data" | "pemeriksaan" | "lab" | "notifikasi" | "jadwal";

// State UI murni (tab aktif di halaman detail). Data server tidak disimpan di sini.
interface DetailTabState {
  tab: DetailTab;
  setTab: (t: DetailTab) => void;
}

export const useDetailTabStore = create<DetailTabState>((set) => ({
  tab: "data",
  setTab: (tab) => set({ tab }),
}));

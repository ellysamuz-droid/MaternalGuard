import { create } from "zustand";

export type FollowUpTab = "catatan" | "reminder";
export type NoteStatusFilter = "Semua" | "Pending" | "Selesai";

interface FollowUpUIState {
  activeTab: FollowUpTab;
  isAddModalOpen: boolean;
  statusFilter: NoteStatusFilter;
  setActiveTab: (tab: FollowUpTab) => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  setStatusFilter: (filter: NoteStatusFilter) => void;
}

// Store Zustand (~0.5 KB) murni untuk Client UI State widget Tindak Lanjut &
// Pengingat Kontrol. Tidak menyimpan satu pun data hasil fetch API — data
// server sepenuhnya dipegang oleh cache TanStack Query (hooks/useFollowUpQuery.ts).
// Dipanggil langsung dari komponen mana pun tanpa <Provider> pembungkus.
export const useFollowUpUIStore = create<FollowUpUIState>()((set) => ({
  activeTab: "catatan",
  isAddModalOpen: false,
  statusFilter: "Semua",
  setActiveTab: (tab) => set({ activeTab: tab }),
  openAddModal: () => set({ isAddModalOpen: true }),
  closeAddModal: () => set({ isAddModalOpen: false }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
}));

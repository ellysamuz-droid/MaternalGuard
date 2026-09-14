"use client";

import { useState, type FormEvent } from "react";
import { useFollowUpUIStore } from "@/store/useFollowUpUIStore";
import {
  useCreateFollowUpNoteMutation,
  useCreateReminderMutation,
  useFollowUpNotesQuery,
  useRemindersQuery,
} from "@/hooks/useFollowUpQuery";
import type { CreateReminderInput } from "@/lib/schemas/followup";

const JENIS_OPTIONS: CreateReminderInput["jenisPemeriksaan"][] = [
  "Kontrol rutin",
  "USG",
  "Lab darah/urine",
  "Rujuk spesialis",
];

// ---------------------------------------------------------------------------
// Widget "Catatan Tindak Lanjut & Pengingat Kontrol" — Modul 7.
// Dipasang sebagai daun Client Component di dalam halaman Server Component
// `pasien/[id]/page.tsx`, tanpa mengubah RSC lain di sekitarnya.
//
// Pemisahan tegas:
//   - Zustand (useFollowUpUIStore): tab aktif, modal buka/tutup, filter status
//   - TanStack Query (hooks/useFollowUpQuery): data catatan & reminder,
//     loading/error state, mutasi + invalidateQueries
// ---------------------------------------------------------------------------
export default function FollowUpWidget({ patientId }: { patientId: string }) {
  // --- Client UI State (Zustand) ---
  const activeTab = useFollowUpUIStore((s) => s.activeTab);
  const setActiveTab = useFollowUpUIStore((s) => s.setActiveTab);
  const isAddModalOpen = useFollowUpUIStore((s) => s.isAddModalOpen);
  const openAddModal = useFollowUpUIStore((s) => s.openAddModal);
  const closeAddModal = useFollowUpUIStore((s) => s.closeAddModal);
  const statusFilter = useFollowUpUIStore((s) => s.statusFilter);
  const setStatusFilter = useFollowUpUIStore((s) => s.setStatusFilter);

  return (
    <div className="fw-widget">
      <div className="fw-head">
        <h3>Catatan Tindak Lanjut &amp; Pengingat Kontrol</h3>
        <button className="btn btn-primary btn-sm" onClick={openAddModal}>
          + Tambah {activeTab === "catatan" ? "catatan" : "pengingat"}
        </button>
      </div>

      <div className="fw-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "catatan"}
          className={`fw-tab ${activeTab === "catatan" ? "active" : ""}`}
          onClick={() => setActiveTab("catatan")}
        >
          Catatan Tindak Lanjut
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "reminder"}
          className={`fw-tab ${activeTab === "reminder" ? "active" : ""}`}
          onClick={() => setActiveTab("reminder")}
        >
          Pengingat Kontrol
        </button>
      </div>

      {activeTab === "catatan" ? (
        <>
          <div className="fw-filter">
            <label>Filter status:</label>
            {(["Semua", "Pending", "Selesai"] as const).map((f) => (
              <button
                key={f}
                className={`fw-filter-chip ${statusFilter === f ? "active" : ""}`}
                onClick={() => setStatusFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <NotesList patientId={patientId} statusFilter={statusFilter} />
        </>
      ) : (
        <ReminderList patientId={patientId} />
      )}

      {isAddModalOpen && (
        <AddModal patientId={patientId} activeTab={activeTab} onClose={closeAddModal} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daftar Catatan — Server State via TanStack Query
// ---------------------------------------------------------------------------
function NotesList({
  patientId,
  statusFilter,
}: {
  patientId: string;
  statusFilter: "Semua" | "Pending" | "Selesai";
}) {
  const { data: notes, isLoading, isError, error } = useFollowUpNotesQuery(patientId);

  // --- Async UI states, langsung dari TanStack Query (bukan Suspense RSC) ---
  if (isLoading) {
    return (
      <div className="fw-list">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton fw-skeleton-item" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fw-error">
        Gagal memuat catatan: {error instanceof Error ? error.message : "Terjadi kesalahan"}
      </div>
    );
  }

  const filtered = notes?.filter((n) => statusFilter === "Semua" || n.status === statusFilter) ?? [];

  if (filtered.length === 0) {
    return <div className="fw-empty">Belum ada catatan tindak lanjut untuk filter ini.</div>;
  }

  return (
    <ul className="fw-list">
      {filtered.map((n) => (
        <li key={n.id} className="fw-item">
          <span className={`badge ${n.status === "Selesai" ? "success" : "warning"}`}>{n.status}</span>
          <p>{n.note}</p>
          <time>{new Date(n.createdAt).toLocaleString("id-ID")}</time>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Daftar Reminder — Server State via TanStack Query
// ---------------------------------------------------------------------------
function ReminderList({ patientId }: { patientId: string }) {
  const { data: reminders, isLoading, isError, error } = useRemindersQuery(patientId);

  if (isLoading) {
    return (
      <div className="fw-list">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton fw-skeleton-item" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fw-error">
        Gagal memuat pengingat: {error instanceof Error ? error.message : "Terjadi kesalahan"}
      </div>
    );
  }

  if (!reminders || reminders.length === 0) {
    return <div className="fw-empty">Belum ada jadwal kontrol yang diatur untuk pasien ini.</div>;
  }

  return (
    <ul className="fw-list">
      {reminders.map((r) => (
        <li key={r.id} className="fw-item">
          <span className={`badge ${r.terkirim ? "success" : "warning"}`}>
            {r.terkirim ? "Terkirim" : "Belum terkirim"}
          </span>
          <p>
            {r.jenisPemeriksaan} &middot; {new Date(r.tanggal).toLocaleDateString("id-ID")}
          </p>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Modal tambah data — memicu useMutation, lalu invalidateQueries di onSuccess
// ---------------------------------------------------------------------------
function AddModal({
  patientId,
  activeTab,
  onClose,
}: {
  patientId: string;
  activeTab: "catatan" | "reminder";
  onClose: () => void;
}) {
  const createNote = useCreateFollowUpNoteMutation(patientId);
  const createReminder = useCreateReminderMutation(patientId);
  const [note, setNote] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jenis, setJenis] = useState<CreateReminderInput["jenisPemeriksaan"]>(JENIS_OPTIONS[0]);

  const mutation = activeTab === "catatan" ? createNote : createReminder;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (activeTab === "catatan") {
      createNote.mutate(
        { patientId, note },
        { onSuccess: () => onClose() }
      );
    } else {
      createReminder.mutate(
        { patientId, tanggal, jenisPemeriksaan: jenis },
        { onSuccess: () => onClose() }
      );
    }
  }

  return (
    <div className="fw-modal-backdrop" onClick={onClose}>
      <div className="fw-modal" onClick={(e) => e.stopPropagation()}>
        <h4>{activeTab === "catatan" ? "Tambah catatan tindak lanjut" : "Tambah pengingat kontrol"}</h4>
        <form onSubmit={handleSubmit}>
          {activeTab === "catatan" ? (
            <textarea
              placeholder="Tulis catatan tindak lanjut..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              minLength={3}
            />
          ) : (
            <>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
              <select value={jenis} onChange={(e) => setJenis(e.target.value as typeof jenis)}>
                {JENIS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </>
          )}

          {mutation.isError && (
            <p className="field-error">
              {mutation.error instanceof Error ? mutation.error.message : "Gagal menyimpan data."}
            </p>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

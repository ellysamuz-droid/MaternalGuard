"use client";

import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";
import { type FollowUpState, markFollowUpAction } from "@/lib/actions";

const initialState: FollowUpState = { status: "idle" };

// Client leaf: textarea terkontrol + tombol submit ke Server Action. Induknya
// (halaman detail pasien) tetap Server Component.
export default function FollowUpForm({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const [note, setNote] = useState("");
  const [state, setState] = useState<FollowUpState>(initialState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await markFollowUpAction(state, formData);
      setState(result);
      if (result.status === "success") setNote("");
    });
  }

  return (
    <div className="followup-box">
      <h3>Tindak lanjut</h3>
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="patientId" value={patientId} />
        <textarea
          name="note"
          placeholder={`Catat hasil hubungan/pemeriksaan dengan ${patientName}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {state.status === "error" && (
          <p className="field-error" style={{ marginBottom: 10 }}>
            {state.message}
          </p>
        )}
        {state.status === "success" && (
          <p style={{ color: "var(--success)", fontSize: 13, marginBottom: 10 }}>{state.message}</p>
        )}
        <div className="form-actions" style={{ justifyContent: "flex-start" }}>
          <button type="submit" className="btn btn-outline" disabled={!note.trim() || isPending}>
            {isPending ? "Menyimpan..." : "Tandai sudah dihubungi"}
          </button>
          <Link href={`/periksa/${patientId}`} className="btn btn-primary">
            Rujuk / catat periksa langsung
          </Link>
        </div>
      </form>
    </div>
  );
}

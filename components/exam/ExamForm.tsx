"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cloneElement, type FormEvent, isValidElement, useState, useTransition } from "react";
import { type ExamState, submitExamAction } from "@/lib/actions";
import { examSchema, zodIssuesToFieldErrors } from "@/lib/validation";

const FINDINGS = [
  { id: "edema", label: "Edema (bengkak kaki/tangan)" },
  { id: "protein", label: "Protein urin +" },
  { id: "sakitKepala", label: "Nyeri kepala persisten" },
  { id: "penglihatan", label: "Gangguan penglihatan saat diperiksa" },
  { id: "nyeriUluHati", label: "Nyeri ulu hati" },
  { id: "djjAbnormal", label: "Denyut jantung janin abnormal" },
];

const initialState: ExamState = { status: "idle" };

// Satu-satunya bagian interaktif pada alur "Catat Hasil Periksa": semua
// input terkontrol + validasi tinggal di komponen daun ini. Skema Zod yang
// SAMA (lib/validation.ts) dipakai dua kali — di sini untuk validasi cepat
// sisi klien (poin c), dan di dalam Server Action `submitExamAction` untuk
// validasi otoritatif sisi server (tidak boleh dilewati meski JS klien
// dimatikan/dimanipulasi).
export default function ExamForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [state, setState] = useState<ExamState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [temuan, setTemuan] = useState<Record<string, boolean>>({ edema: true, sakitKepala: true });

  function toggleFinding(id: string) {
    setTemuan((t) => ({ ...t, [id]: !t[id] }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    for (const [id, checked] of Object.entries(temuan)) {
      if (checked) formData.set(`temuan.${id}`, "on");
    }

    // Pre-check ringan di klien agar pengguna dapat feedback instan tanpa
    // menunggu round-trip ke server (khususnya berguna untuk rentang nilai
    // fisiologis tekanan darah).
    const draft: Record<string, unknown> = Object.fromEntries(formData.entries());
    draft.temuan = temuan;
    const clientCheck = examSchema.safeParse(draft);
    if (!clientCheck.success) {
      setState({
        status: "error",
        fieldErrors: zodIssuesToFieldErrors(clientCheck.error),
      });
      return;
    }

    startTransition(async () => {
      const result = await submitExamAction(state, formData);
      setState(result);
      if (result.status === "success") {
        setTimeout(() => router.push("/dashboard"), 900);
      }
    });
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="patientId" value={patientId} />

      {state.formError && (
        <div className="callout" style={{ borderColor: "#AE423B", color: "#AE423B" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{state.formError}</span>
        </div>
      )}
      {state.status === "success" && (
        <div className="callout" style={{ borderColor: "var(--success)", color: "var(--success)" }}>
          <span>Catatan periksa tersimpan. Mengalihkan ke dashboard...</span>
        </div>
      )}

      <div className="form-section">
        <p className="label-lg">Waktu pemeriksaan</p>
        <div className="field-grid cols-2">
          <Field label="Tanggal" error={errors.tanggal}>
            <input type="date" name="tanggal" defaultValue="2026-08-20" />
          </Field>
          <Field label="Jam" error={errors.jam}>
            <input type="time" name="jam" defaultValue="10:30" />
          </Field>
        </div>
      </div>

      <div className="form-section">
        <p className="label-lg">Hasil ukur manual (oleh bidan)</p>
        <div className="field-grid cols-4">
          <Field label="Sistolik (mmHg)" error={errors.sistolik}>
            <input className="mono" type="number" name="sistolik" placeholder="mis. 138" />
          </Field>
          <Field label="Diastolik (mmHg)" error={errors.diastolik}>
            <input className="mono" type="number" name="diastolik" placeholder="mis. 90" />
          </Field>
          <Field label="Nadi (bpm)" error={errors.nadi}>
            <input className="mono" type="number" name="nadi" placeholder="mis. 88" />
          </Field>
          <Field label="Berat (kg)" error={errors.berat}>
            <input className="mono" type="number" name="berat" placeholder="mis. 68" />
          </Field>
        </div>
      </div>

      <div className="form-section">
        <p className="label-lg">Temuan pemeriksaan fisik</p>
        <div className="check-grid">
          {FINDINGS.map((f) => (
            <label key={f.id}>
              <input
                type="checkbox"
                checked={!!temuan[f.id]}
                onChange={() => toggleFinding(f.id)}
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <div className="form-section">
        <p className="label-lg">Catatan pemeriksaan</p>
        <Field error={errors.catatan}>
          <textarea
            name="catatan"
            style={{ width: "100%", minHeight: 90 }}
            placeholder="Tuliskan hasil observasi, anamnesis tambahan, atau catatan klinis lain..."
          />
        </Field>
      </div>

      <div className="form-section">
        <p className="label-lg">Diagnosis sementara</p>
        <select style={{ width: "100%" }} name="diagnosis" defaultValue="Suspek preeklamsia ringan">
          <option>Suspek preeklamsia ringan</option>
          <option>Hipertensi gestasional</option>
          <option>Kondisi normal, monitoring lanjut</option>
          <option>Perlu pemeriksaan lanjutan di RS</option>
        </select>
      </div>

      <div className="followup-box">
        <h3>Rencana tindak lanjut</h3>
        <div className="radio-list">
          <label>
            <input type="radio" name="tindakLanjut" value="kontrol" defaultChecked />
            Kontrol ulang 3 hari lagi di puskesmas
          </label>
          <label>
            <input type="radio" name="tindakLanjut" value="rujuk" />
            Rujuk ke fasilitas kesehatan lanjutan
          </label>
          <label>
            <input type="radio" name="tindakLanjut" value="monitor" />
            Monitoring rutin, tidak ada tindakan tambahan
          </label>
        </div>
        <label
          htmlFor="instruksi"
          style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 4 }}
        >
          Instruksi untuk pasien (akan tampil di aplikasi pasien)
        </label>
        <textarea
          id="instruksi"
          name="instruksi"
          style={{ width: "100%", minHeight: 60 }}
          placeholder="mis. Kurangi asupan garam, istirahat cukup, segera hubungi bidan jika pusing memberat"
        />
      </div>

      <div className="form-actions">
        <Link href="/dashboard" className="btn btn-outline">
          Batal
        </Link>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? (
            <>
              <span className="spinner spinner-sm" />
              Menyimpan...
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Simpan Catatan Periksa
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const controlId = isValidElement<{ name?: string; id?: string }>(children)
    ? (children.props.id ?? children.props.name)
    : undefined;
  const control =
    controlId && isValidElement<{ id?: string }>(children)
      ? cloneElement(children, { id: controlId })
      : children;

  return (
    <div className={`field${error ? " has-error" : ""}`}>
      {label &&
        // biome-ignore lint/a11y/noLabelWithoutControl: htmlFor selalu diisi saat controlId ada; fallback tanpa htmlFor hanya untuk Field tanpa child input (mis. textarea di luar Field)
        (controlId ? <label htmlFor={controlId}>{label}</label> : <label>{label}</label>)}
      {control}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

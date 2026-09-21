"use client";

import { type FormEvent, useState } from "react";
import { useCreateVitalMutation } from "@/hooks/usePortalQuery";
import { SYMPTOM_KEYS, SYMPTOM_LABELS, type SymptomKey } from "@/lib/types";

export default function VitalInputForm({ patientId }: { patientId: string }) {
  const mutation = useCreateVitalMutation(patientId);
  const [sistolik, setSistolik] = useState("");
  const [diastolik, setDiastolik] = useState("");
  const [nadi, setNadi] = useState("");
  const [berat, setBerat] = useState("");
  const [keluhan, setKeluhan] = useState<SymptomKey[]>([]);

  function toggleKeluhan(key: SymptomKey) {
    setKeluhan((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate(
      {
        patientId,
        tanggal: new Date().toISOString().slice(0, 10),
        sistolik: Number(sistolik),
        diastolik: Number(diastolik),
        nadi: Number(nadi),
        berat: Number(berat),
        keluhan,
      },
      {
        onSuccess: () => {
          setSistolik("");
          setDiastolik("");
          setNadi("");
          setBerat("");
          setKeluhan([]);
        },
      },
    );
  }

  return (
    <div className="card">
      <h2>Input Data Vital Harian</h2>
      <form onSubmit={handleSubmit} className="portal-form">
        <div className="portal-form-grid">
          <div className="field">
            <label htmlFor="sistolik">Sistolik (mmHg)</label>
            <input
              id="sistolik"
              type="number"
              required
              min={60}
              max={260}
              value={sistolik}
              onChange={(e) => setSistolik(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="diastolik">Diastolik (mmHg)</label>
            <input
              id="diastolik"
              type="number"
              required
              min={40}
              max={180}
              value={diastolik}
              onChange={(e) => setDiastolik(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="nadi">Nadi (bpm)</label>
            <input
              id="nadi"
              type="number"
              required
              min={30}
              max={220}
              value={nadi}
              onChange={(e) => setNadi(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="berat">Berat badan (kg)</label>
            <input
              id="berat"
              type="number"
              step="0.1"
              required
              min={30}
              max={200}
              value={berat}
              onChange={(e) => setBerat(e.target.value)}
            />
          </div>
        </div>

        <fieldset className="portal-symptoms">
          <legend>Checklist Keluhan Hari Ini (FR-05)</legend>
          {SYMPTOM_KEYS.map((key) => (
            <label key={key} className="portal-checkbox">
              <input
                type="checkbox"
                checked={keluhan.includes(key)}
                onChange={() => toggleKeluhan(key)}
              />
              {SYMPTOM_LABELS[key]}
            </label>
          ))}
        </fieldset>

        {mutation.isError && (
          <p className="field-error">
            {mutation.error instanceof Error ? mutation.error.message : "Gagal menyimpan data."}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Menghitung risiko..." : "Simpan & Hitung Risiko"}
          </button>
        </div>
      </form>

      {mutation.isSuccess && (
        <div className={`portal-result ${mutation.data.risk.level}`}>
          <h3>Hasil Perhitungan Risiko (FR-06/07/08)</h3>
          <div className="portal-result-grid">
            <div>
              <span className="label">Trend Score</span>
              <span className="value">{mutation.data.risk.trendScore}</span>
            </div>
            <div>
              <span className="label">Symptom Score</span>
              <span className="value">{mutation.data.risk.symptomScore}</span>
            </div>
            <div>
              <span className="label">Weighted Score</span>
              <span className="value">{mutation.data.risk.weightedScore}</span>
            </div>
            <div>
              <span className="label">Klasifikasi</span>
              <span className={`badge ${mutation.data.risk.level}`}>
                {mutation.data.risk.level}
              </span>
            </div>
          </div>
          {mutation.data.notification && (
            <p className="portal-notif-preview">🔔 {mutation.data.notification.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { submitExamResult } from '../../api/mockApi.js';

const FINDINGS = [
  { id: 'edema', label: 'Edema (bengkak kaki/tangan)' },
  { id: 'protein', label: 'Protein urin +' },
  { id: 'sakitKepala', label: 'Nyeri kepala persisten' },
  { id: 'penglihatan', label: 'Gangguan penglihatan saat diperiksa' },
  { id: 'nyeriUluHati', label: 'Nyeri ulu hati' },
  { id: 'djjAbnormal', label: 'Denyut jantung janin abnormal' },
];

const initialForm = {
  tanggal: '2026-08-20',
  jam: '10:30',
  sistolik: '',
  diastolik: '',
  nadi: '',
  berat: '',
  catatan: '',
  diagnosis: 'Suspek preeklamsia ringan',
  tindakLanjut: 'kontrol',
  instruksi: '',
  temuan: { edema: true, sakitKepala: true },
};

// Modul UI: "Form Catat Hasil Periksa" — validasi input & feedback ke pengguna
export default function ExamForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | submitting | error | success
  const [submitError, setSubmitError] = useState('');

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function toggleFinding(id) {
    setForm((f) => ({ ...f, temuan: { ...f.temuan, [id]: !f.temuan[id] } }));
  }

  function validate(values) {
    const next = {};
    if (!values.tanggal) next.tanggal = 'Tanggal wajib diisi.';
    if (!values.jam) next.jam = 'Jam wajib diisi.';

    if (values.sistolik === '' || values.sistolik === null) {
      next.sistolik = 'Sistolik wajib diisi.';
    } else if (Number(values.sistolik) < 60 || Number(values.sistolik) > 260) {
      next.sistolik = 'Nilai sistolik di luar rentang wajar (60–260 mmHg).';
    }

    if (values.diastolik === '' || values.diastolik === null) {
      next.diastolik = 'Diastolik wajib diisi.';
    } else if (Number(values.diastolik) < 30 || Number(values.diastolik) > 180) {
      next.diastolik = 'Nilai diastolik di luar rentang wajar (30–180 mmHg).';
    }

    if (
      values.sistolik !== '' &&
      values.diastolik !== '' &&
      Number(values.diastolik) >= Number(values.sistolik)
    ) {
      next.diastolik = 'Diastolik harus lebih kecil dari sistolik.';
    }

    if (values.nadi !== '' && (Number(values.nadi) < 30 || Number(values.nadi) > 220)) {
      next.nadi = 'Nadi di luar rentang wajar (30–220 bpm).';
    }

    if (values.berat !== '' && Number(values.berat) <= 0) {
      next.berat = 'Berat badan harus lebih dari 0.';
    }

    if (!values.catatan.trim()) {
      next.catatan = 'Catatan pemeriksaan tidak boleh kosong.';
    }

    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setSubmitStatus('idle');
      return;
    }

    setSubmitStatus('submitting');
    setSubmitError('');
    try {
      await submitExamResult({ patientId, ...form });
      setSubmitStatus('success');
      setTimeout(() => navigate('/'), 900);
    } catch (err) {
      setSubmitStatus('error');
      setSubmitError(err.message);
    }
  }

  return (
    <>
      <Link to="/" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
        Kembali ke dashboard
      </Link>

      <div className="patient-banner">
        <div className="avatar danger">I{patientId}</div>
        <div className="info">
          <strong>Catat Hasil Periksa Langsung</strong>
          <span>Pasien {patientId} &middot; kunjungan pemeriksaan manual</span>
        </div>
      </div>

      {submitStatus === 'error' && (
        <div className="callout" style={{ borderColor: '#AE423B', color: '#AE423B' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <p className="label-lg">Waktu pemeriksaan</p>
          <div className="field-grid cols-2">
            <Field label="Tanggal" error={errors.tanggal}>
              <input
                type="date"
                value={form.tanggal}
                onChange={(e) => updateField('tanggal', e.target.value)}
              />
            </Field>
            <Field label="Jam" error={errors.jam}>
              <input
                type="time"
                value={form.jam}
                onChange={(e) => updateField('jam', e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="form-section">
          <p className="label-lg">Hasil ukur manual (oleh bidan)</p>
          <div className="field-grid cols-4">
            <Field label="Sistolik (mmHg)" error={errors.sistolik}>
              <input
                className="mono"
                type="number"
                placeholder="mis. 138"
                value={form.sistolik}
                onChange={(e) => updateField('sistolik', e.target.value)}
              />
            </Field>
            <Field label="Diastolik (mmHg)" error={errors.diastolik}>
              <input
                className="mono"
                type="number"
                placeholder="mis. 90"
                value={form.diastolik}
                onChange={(e) => updateField('diastolik', e.target.value)}
              />
            </Field>
            <Field label="Nadi (bpm)" error={errors.nadi}>
              <input
                className="mono"
                type="number"
                placeholder="mis. 88"
                value={form.nadi}
                onChange={(e) => updateField('nadi', e.target.value)}
              />
            </Field>
            <Field label="Berat (kg)" error={errors.berat}>
              <input
                className="mono"
                type="number"
                placeholder="mis. 68"
                value={form.berat}
                onChange={(e) => updateField('berat', e.target.value)}
              />
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
                  checked={!!form.temuan[f.id]}
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
              style={{ width: '100%', minHeight: 90 }}
              placeholder="Tuliskan hasil observasi, anamnesis tambahan, atau catatan klinis lain..."
              value={form.catatan}
              onChange={(e) => updateField('catatan', e.target.value)}
            />
          </Field>
        </div>

        <div className="form-section">
          <p className="label-lg">Diagnosis sementara</p>
          <select
            style={{ width: '100%' }}
            value={form.diagnosis}
            onChange={(e) => updateField('diagnosis', e.target.value)}
          >
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
              <input
                type="radio"
                name="tindak"
                checked={form.tindakLanjut === 'kontrol'}
                onChange={() => updateField('tindakLanjut', 'kontrol')}
              />
              Kontrol ulang 3 hari lagi di puskesmas
            </label>
            <label>
              <input
                type="radio"
                name="tindak"
                checked={form.tindakLanjut === 'rujuk'}
                onChange={() => updateField('tindakLanjut', 'rujuk')}
              />
              Rujuk ke fasilitas kesehatan lanjutan
            </label>
            <label>
              <input
                type="radio"
                name="tindak"
                checked={form.tindakLanjut === 'monitor'}
                onChange={() => updateField('tindakLanjut', 'monitor')}
              />
              Monitoring rutin, tidak ada tindakan tambahan
            </label>
          </div>
          <label style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>
            Instruksi untuk pasien (akan tampil di aplikasi pasien)
          </label>
          <textarea
            style={{ width: '100%', minHeight: 60 }}
            placeholder="mis. Kurangi asupan garam, istirahat cukup, segera hubungi bidan jika pusing memberat"
            value={form.instruksi}
            onChange={(e) => updateField('instruksi', e.target.value)}
          />
        </div>

        <div className="form-actions">
          <Link to="/" className="btn btn-outline">Batal</Link>
          <button type="submit" className="btn btn-primary" disabled={submitStatus === 'submitting'}>
            {submitStatus === 'submitting' ? (
              <>
                <span className="spinner spinner-sm" />
                Menyimpan...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Simpan Catatan Periksa
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}

function Field({ label, error, children }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      {label && <label>{label}</label>}
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

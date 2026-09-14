import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPatientDetail } from '../../api/mockApi.js';
import { LoadingBox, ErrorBox } from '../Layout/StateBox.jsx';
import TrendChart from './TrendChart.jsx';

const STATUS_LABEL = { tinggi: 'Risiko tinggi', sedang: 'Risiko sedang', rendah: 'Risiko rendah' };

// Modul UI: "Detail / Riwayat Pasien" — data table + grafik tren
export default function PatientDetail() {
  const { patientId } = useParams();
  const [state, setState] = useState({ status: 'loading', patient: null, history: [], error: '' });
  const [followUpNote, setFollowUpNote] = useState('');

  async function load() {
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    try {
      const { patient, history } = await fetchPatientDetail(patientId);
      setState({ status: 'success', patient, history, error: '' });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  }

  useEffect(() => {
    load();
    setFollowUpNote('');
  }, [patientId]);

  if (state.status === 'loading') return <LoadingBox label="Memuat riwayat pasien..." />;
  if (state.status === 'error') return <ErrorBox message={state.error} onRetry={load} />;

  const { patient, history } = state;
  const baseline = history[0];
  const latest = history[history.length - 1];

  return (
    <>
      <Link to="/" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
        Kembali ke dashboard
      </Link>

      <div className="patient-banner">
        <div className={`avatar ${patient.status === 'tinggi' ? 'danger' : 'warning'}`}>
          {patient.name.replace('Ibu ', 'I')}
        </div>
        <div className="info">
          <strong>{patient.name} &middot; {patient.age} tahun &middot; {patient.week} minggu</strong>
          <span>Puskesmas Manguharjo &middot; riwayat preeklamsia: tidak ada</span>
        </div>
        <span className={`badge ${patient.status}`}>{STATUS_LABEL[patient.status]}</span>
      </div>

      <section className="vital-strip">
        <div className="stat-card">
          <p className="label">Tensi hari ini</p>
          <p className="value">{latest?.sistolik}/{latest?.diastolik}</p>
        </div>
        <div className="stat-card">
          <p className="label">Baseline normal</p>
          <p className="value">{baseline?.sistolik}/{baseline?.diastolik}</p>
        </div>
        <div className="stat-card">
          <p className="label">Risk score</p>
          <p className="value">{patient.riskScore}<span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>/100</span></p>
        </div>
      </section>

      <div className="section-head">
        <h2>Tren tekanan darah, 7 hari terakhir</h2>
      </div>
      <TrendChart history={history} />

      <div className="section-head">
        <h2>Riwayat keluhan harian</h2>
      </div>
      <div className="table-card">
        <div className="history-row head">
          <span>Tanggal</span><span>Tensi</span><span>Keluhan</span>
        </div>
        {history.map((h) => (
          <div className={`history-row${h.severity === 'severe' ? ' flagged' : ''}`} key={h.date}>
            <span style={h.severity === 'severe' ? { fontWeight: 600 } : undefined}>{h.date}</span>
            <span className="vital-num" style={h.severity === 'severe' ? { fontWeight: 600 } : undefined}>
              {h.sistolik}/{h.diastolik}
            </span>
            <span className={`complaint-${h.severity}`}>{h.complaint}</span>
          </div>
        ))}
      </div>

      <div className="followup-box">
        <h3>Tindak lanjut</h3>
        <textarea
          placeholder={`Catat hasil hubungan/pemeriksaan dengan ${patient.name}`}
          value={followUpNote}
          onChange={(e) => setFollowUpNote(e.target.value)}
        />
        <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className="btn btn-outline" disabled={!followUpNote.trim()}>
            Tandai sudah dihubungi
          </button>
          <Link to={`/periksa/${patient.id}`} className="btn btn-primary">
            Rujuk / catat periksa langsung
          </Link>
        </div>
      </div>
    </>
  );
}

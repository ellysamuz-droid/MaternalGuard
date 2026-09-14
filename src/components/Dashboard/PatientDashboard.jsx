import { useEffect, useState } from 'react';
import { fetchPatients } from '../../api/mockApi.js';
import { LoadingBox, ErrorBox } from '../Layout/StateBox.jsx';
import StatCard from './StatCard.jsx';
import PatientTable from './PatientTable.jsx';
import { Link } from 'react-router-dom';

// Modul UI: "Dashboard Pasien"
// State: daftar pasien, status loading, status error (dari simulasi API async)
export default function PatientDashboard() {
  const [patients, setPatients] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');

  async function loadPatients() {
    setStatus('loading');
    setErrorMessage('');
    try {
      const data = await fetchPatients();
      setPatients(data);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  if (status === 'loading' || status === 'idle') {
    return <LoadingBox label="Memuat data pasien..." />;
  }

  if (status === 'error') {
    return <ErrorBox message={errorMessage} onRetry={loadPatients} />;
  }

  // Derived state — React Compiler otomatis memoize komputasi ini (tanpa useMemo manual)
  const total = patients.length;
  const highRisk = patients.filter((p) => p.status === 'tinggi');
  const mediumRisk = patients.filter((p) => p.status === 'sedang');
  const lowRisk = patients.filter((p) => p.status === 'rendah');
  const urgent = [...highRisk, ...mediumRisk].slice(0, 2);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard Pasien</h1>
          <p>Ringkasan status risiko seluruh ibu hamil binaan Anda hari ini.</p>
        </div>
        <div className="notif-pill">
          <span className="dot" />
          3 notifikasi baru
        </div>
      </div>

      <section className="stat-grid">
        <StatCard label="Total pasien" value={total} />
        <StatCard label="Risiko tinggi" value={highRisk.length} tone="danger" />
        <StatCard label="Risiko sedang" value={mediumRisk.length} tone="warning" />
        <StatCard label="Risiko rendah" value={lowRisk.length} tone="success" />
      </section>

      <section className="panel">
        <p className="panel-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Perlu tindak lanjut segera
        </p>

        {urgent.map((p) => (
          <div className="patient-row" key={p.id}>
            <div className="patient-id">
              <div className={`avatar ${p.status === 'tinggi' ? 'danger' : 'warning'}`}>
                {p.name.replace('Ibu ', 'I')}
              </div>
              <div>
                <p className="name">{p.name} &middot; {p.week} minggu</p>
                <p className="meta">
                  <span className="vital">{p.sistolik}/{p.diastolik}</span> &middot; {p.complaint}
                </p>
              </div>
            </div>
            <div className="row-actions">
              <Link to={`/pasien/${p.id}`} className="btn btn-outline btn-sm">Lihat detail</Link>
              <Link to={`/periksa/${p.id}`} className="btn btn-primary btn-sm">Catat hasil periksa</Link>
            </div>
          </div>
        ))}
      </section>

      <div className="section-head">
        <h2>Semua pasien binaan</h2>
        <select aria-label="Urutkan daftar pasien">
          <option>Urutkan: risiko tertinggi</option>
          <option>Urutkan: nama</option>
          <option>Urutkan: usia kehamilan</option>
        </select>
      </div>

      <PatientTable patients={patients} />
    </>
  );
}

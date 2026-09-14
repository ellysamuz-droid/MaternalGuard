import { useNavigate } from 'react-router-dom';

const STATUS_LABEL = { tinggi: 'Tinggi', sedang: 'Sedang', rendah: 'Rendah' };

export default function PatientTable({ patients }) {
  const navigate = useNavigate();

  return (
    <div className="table-card">
      <div className="t-row head">
        <span>Pasien</span>
        <span>Tensi terakhir</span>
        <span>Status</span>
        <span></span>
        <span></span>
      </div>

      {patients.map((p) => (
        <div
          key={p.id}
          className="t-row t-row-click"
          onClick={() => navigate(`/pasien/${p.id}`)}
        >
          <span>{p.name} &middot; {p.week} minggu</span>
          <span className="vital-num">{p.sistolik}/{p.diastolik}</span>
          <span className={`badge ${p.status}`}>{STATUS_LABEL[p.status]}</span>
          <a
            href={`/periksa/${p.id}`}
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              navigate(`/periksa/${p.id}`);
            }}
          >
            Catat periksa
          </a>
          <span className="chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </div>
      ))}
    </div>
  );
}

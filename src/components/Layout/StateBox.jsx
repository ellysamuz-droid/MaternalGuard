// Komponen reusable untuk menampilkan indikator loading & error
// hasil pemanggilan API asinkron (dipakai di Dashboard & Detail Pasien).
export function LoadingBox({ label = 'Memuat data...' }) {
  return (
    <div className="state-box">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="state-box is-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}

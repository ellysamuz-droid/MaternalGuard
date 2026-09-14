import { NavLink } from 'react-router-dom';

// Komponen Sidebar (reusable di semua halaman)
export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="mark">MG</span>
        MaternalGuard
      </div>
      <nav>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          Dashboard Pasien
        </NavLink>
        <a href="#!">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          Notifikasi
        </a>
        <a href="#!">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Riwayat Tindak Lanjut
        </a>
      </nav>
      <div className="user">
        <strong>Bidan Siti Aminah</strong>
        Puskesmas Manguharjo
      </div>
    </aside>
  );
}

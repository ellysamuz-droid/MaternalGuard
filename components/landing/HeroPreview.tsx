// Ilustrasi tampilan aplikasi memakai HTML/CSS/SVG (bukan tangkapan layar).
// Seluruh nama dan angka adalah DATA FIKTIF untuk contoh.
export default function HeroPreview() {
  return (
    <div className="lp-preview" aria-hidden="true">
      <div className="lp-card-main">
        <div className="d-flex align-items-center gap-3 mb-3">
          <span className="mg-avatar">SR</span>
          <div className="flex-grow-1">
            <strong className="d-block">Ibu Contoh</strong>
            <span className="small text-muted-mg">29 tahun &middot; 32 minggu kehamilan</span>
          </div>
          <span className="mg-badge mg-high">
            <i className="bi bi-exclamation-triangle-fill" /> High risk
          </span>
        </div>

        <div className="small text-muted-mg mb-1">Tren tekanan darah</div>
        <svg
          viewBox="0 0 320 110"
          className="w-100"
          role="img"
          aria-label="Contoh grafik tekanan darah naik"
        >
          <defs>
            <linearGradient id="gp" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#e07aa4" stopOpacity="0.35" />
              <stop offset="1" stopColor="#e07aa4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gb" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#5f98dc" stopOpacity="0.3" />
              <stop offset="1" stopColor="#5f98dc" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g stroke="#edf2fb">
            <line x1="0" x2="320" y1="25" y2="25" />
            <line x1="0" x2="320" y1="55" y2="55" />
            <line x1="0" x2="320" y1="85" y2="85" />
          </g>
          <path d="M10 70 L110 55 L210 42 L310 22 L310 110 L10 110Z" fill="url(#gp)" />
          <path d="M10 92 L110 84 L210 76 L310 64 L310 110 L10 110Z" fill="url(#gb)" />
          <path
            d="M10 70 L110 55 L210 42 L310 22"
            fill="none"
            stroke="#e07aa4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M10 92 L110 84 L210 76 L310 64"
            fill="none"
            stroke="#5f98dc"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <g fill="#fff" strokeWidth="2.5">
            <circle cx="10" cy="70" r="4.5" stroke="#e07aa4" />
            <circle cx="110" cy="55" r="4.5" stroke="#e07aa4" />
            <circle cx="210" cy="42" r="4.5" stroke="#e07aa4" />
            <circle cx="310" cy="22" r="4.5" stroke="#e07aa4" />
          </g>
        </svg>

        <div className="d-flex gap-2 mt-3">
          <span className="mg-badge mg-low">Low</span>
          <i className="bi bi-arrow-right text-muted-mg" />
          <span className="mg-badge mg-mid">Mid</span>
          <i className="bi bi-arrow-right text-muted-mg" />
          <span className="mg-badge mg-high">High</span>
          <span className="ms-auto fw-bold">
            148/96 <small className="text-muted-mg fw-normal">mmHg</small>
          </span>
        </div>
      </div>

      <div className="lp-card-wa">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="lp-wa-dot">
            <i className="bi bi-whatsapp" />
          </span>
          <strong className="small">Pesan ke ibu</strong>
          <span className="mg-badge mg-low ms-auto">
            <i className="bi bi-check2-all" /> Diterima
          </span>
        </div>
        <div className="wa-bubble small">
          Halo Bu, ini pesan dari Bidan. Mohon tetap datang kontrol sesuai jadwal ya, Bu. Jika ada
          pertanyaan, hubungi saya kapan saja.
        </div>
      </div>

      <div className="lp-chip">
        <i className="bi bi-bell-fill" /> Pesan lanjutan 2x per minggu
      </div>
      <div className="lp-caption">Contoh tampilan, data fiktif</div>
    </div>
  );
}

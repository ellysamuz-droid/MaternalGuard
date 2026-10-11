import type { Metadata } from "next";
import Link from "next/link";
import HeroPreview from "@/components/landing/HeroPreview";
import LandingNav from "@/components/landing/LandingNav";
import { registrationEnabled } from "@/lib/features";
import { getSession } from "@/lib/session";

// Satu-satunya halaman publik yang boleh diindeks mesin pencari. Isinya hanya
// penjelasan produk, tanpa data pasien.
export const metadata: Metadata = {
  title: { absolute: "MaternalGuard · Peringatan dini preeklamsia untuk bidan" },
  description:
    "MaternalGuard membantu bidan mencatat pemeriksaan ibu hamil, mengetahui kategori risiko preeklamsia sejak dini, dan mengingatkan ibu berisiko tinggi lewat pesan WhatsApp yang tenang.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "MaternalGuard · Peringatan dini preeklamsia untuk bidan",
    description: "Catat pemeriksaan, lihat kategori risiko, dan ingatkan ibu hamil lewat WhatsApp.",
    type: "website",
    locale: "id_ID",
  },
};

const FITUR = [
  {
    icon: "bi-clipboard2-heart",
    warna: "pink",
    judul: "Catat pemeriksaan rapi",
    isi: "Tekanan darah, nadi, suhu, gula darah, berat badan, dan keluhan tersimpan per ibu hamil, lengkap dengan riwayatnya.",
  },
  {
    icon: "bi-speedometer2",
    warna: "blue",
    judul: "Kategori risiko otomatis",
    isi: "Setiap pemeriksaan langsung diberi kategori low, mid, atau high risk sebagai peringatan dini untuk membantu keputusan bidan.",
  },
  {
    icon: "bi-whatsapp",
    warna: "pink",
    judul: "Pesan WhatsApp otomatis",
    isi: "Ibu dengan high risk menerima pesan kewaspadaan yang tenang, hanya bila ibu telah menyetujuinya.",
  },
  {
    icon: "bi-calendar-check",
    warna: "blue",
    judul: "Jadwal pesan lanjutan",
    isi: "Pesan dikirim 2 kali per minggu dengan tema bergilir: kontrol, istirahat, mengenali tanda, dan tanya kabar. Bisa dijeda kapan saja.",
  },
  {
    icon: "bi-graph-up-arrow",
    warna: "pink",
    judul: "Tren tekanan darah",
    isi: "Grafik sistolik dan diastolik antar kunjungan membantu melihat perubahan yang mudah terlewat di catatan kertas.",
  },
  {
    icon: "bi-shield-lock",
    warna: "blue",
    judul: "Privasi dijaga",
    isi: "Data hanya dapat dilihat bidan yang mencatatnya. Ibu hamil tidak perlu akun, dan pesan berhenti otomatis saat ibu sudah melahirkan.",
  },
];

const LANGKAH = [
  {
    n: 1,
    judul: "Catat",
    isi: "Bidan mengisi tanda vital dan keluhan ibu hamil dalam satu form singkat.",
  },
  {
    n: 2,
    judul: "Nilai",
    isi: "Sistem menghitung kategori risiko otomatis dan menampilkannya saat itu juga.",
  },
  {
    n: 3,
    judul: "Ingatkan",
    isi: "Bila high risk dan ibu setuju, pesan WhatsApp dikirim, lalu dilanjutkan jadwal 2x per minggu.",
  },
  {
    n: 4,
    judul: "Pantau",
    isi: "Lihat tren, riwayat pesan, dan status pengiriman dari satu halaman per ibu.",
  },
];

const FAQ = [
  {
    q: "Apakah MaternalGuard memberi diagnosis?",
    a: "Tidak. Kategori risiko adalah peringatan dini untuk membantu bidan. Keputusan klinis tetap pada bidan dan pemeriksaan langsung.",
  },
  {
    q: "Apakah ibu hamil perlu membuat akun atau mengunduh aplikasi?",
    a: "Tidak perlu. Ibu hamil hanya menerima pesan di WhatsApp. Yang memakai aplikasi web ini adalah bidan.",
  },
  {
    q: "Apakah semua ibu hamil dikirimi pesan?",
    a: "Tidak. Pesan hanya dikirim kepada ibu dengan kategori high risk yang telah menyatakan setuju menerima pesan WhatsApp.",
  },
  {
    q: "Bagaimana jika ibu tidak ingin menerima pesan lagi?",
    a: "Bidan menonaktifkan persetujuan WhatsApp di data ibu tersebut, dan jadwal pesannya berhenti. Setiap pesan juga memuat cara menghubungi bidan untuk berhenti.",
  },
  {
    q: "Siapa yang dapat melihat data ibu hamil?",
    a: "Hanya bidan yang mencatat ibu tersebut. Bidan lain tidak dapat melihat data yang bukan miliknya.",
  },
];

export default function LandingPage() {
  const loggedIn = Boolean(getSession());
  const daftar = registrationEnabled();

  return (
    <div className="lp">
      <LandingNav masuk={loggedIn} daftar={daftar} />

      {/* ---------- Hero ---------- */}
      <section className="lp-hero">
        <div className="lp-blob b1" />
        <div className="lp-blob b2" />
        <div className="lp-container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="lp-eyebrow">
                <i className="bi bi-heart-pulse-fill" /> Peringatan dini preeklamsia untuk bidan
              </span>
              <h1 className="lp-title">
                Pantau kehamilan lebih tenang, kenali risiko <span>sejak dini</span>.
              </h1>
              <p className="lp-lead">
                MaternalGuard membantu bidan mencatat pemeriksaan ibu hamil, melihat kategori risiko
                preeklamsia secara otomatis, dan mengingatkan ibu berisiko tinggi lewat pesan
                WhatsApp yang lembut.
              </p>
              <div className="d-flex flex-wrap gap-3 mb-4">
                {loggedIn ? (
                  <Link href="/dashboard" className="btn btn-primary btn-lg">
                    <i className="bi bi-grid-1x2-fill me-2" />
                    Buka dashboard
                  </Link>
                ) : (
                  <>
                    {daftar ? (
                      <Link href="/daftar" className="btn btn-primary btn-lg">
                        <i className="bi bi-person-plus-fill me-2" />
                        Daftar sebagai bidan
                      </Link>
                    ) : null}
                    <Link
                      href="/login"
                      className={`btn btn-lg ${daftar ? "btn-outline-primary" : "btn-primary"}`}
                    >
                      <i className="bi bi-box-arrow-in-right me-2" />
                      Masuk
                    </Link>
                  </>
                )}
              </div>
              <ul className="lp-trust list-unstyled">
                <li>
                  <i className="bi bi-check-circle-fill" /> Ibu hamil tidak perlu akun atau aplikasi
                </li>
                <li>
                  <i className="bi bi-check-circle-fill" /> Pesan hanya dikirim dengan persetujuan
                  ibu
                </li>
                <li>
                  <i className="bi bi-check-circle-fill" /> Data hanya dapat dilihat bidan yang
                  mencatatnya
                </li>
              </ul>
            </div>
            <div className="col-lg-6">
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Ringkas ---------- */}
      <section className="lp-strip">
        <div className="lp-container">
          <div className="row g-3 text-center">
            {[
              { v: "3", l: "kategori risiko: low, mid, high" },
              { v: "1", l: "pesan langsung saat high risk" },
              { v: "2x", l: "pesan lanjutan per minggu" },
              { v: "0", l: "akun yang perlu dibuat ibu hamil" },
            ].map((s) => (
              <div className="col-6 col-lg-3" key={s.l}>
                <div className="lp-stat">
                  <strong>{s.v}</strong>
                  <span>{s.l}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Tentang ---------- */}
      <section id="tentang" className="lp-section">
        <div className="lp-container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <span className="lp-kicker">Apa itu MaternalGuard?</span>
              <h2 className="lp-h2">
                Pendamping bidan untuk mengenali risiko preeklamsia lebih awal
              </h2>
              <p className="text-muted-mg">
                Preeklamsia adalah gangguan tekanan darah pada kehamilan yang perlu dikenali dan
                dipantau sedini mungkin. MaternalGuard adalah aplikasi web untuk bidan yang
                menyatukan tiga hal dalam satu alur kerja sederhana:
              </p>
              <ul className="lp-points list-unstyled">
                <li>
                  <span>1</span> Pencatatan pemeriksaan yang rapi dan mudah ditelusuri.
                </li>
                <li>
                  <span>2</span> Peringatan dini berupa kategori risiko setiap kali ibu diperiksa.
                </li>
                <li>
                  <span>3</span> Komunikasi lanjutan ke ibu hamil lewat WhatsApp yang tenang dan
                  tidak menakut-nakuti.
                </li>
              </ul>
              <div className="alert mg-alert pink small mb-0" role="note">
                <i className="bi bi-info-circle me-2" />
                MaternalGuard adalah <strong>alat bantu</strong>. Kategori risiko bukan diagnosis
                dan tidak menggantikan penilaian bidan.
              </div>
            </div>
            <div className="col-lg-6">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="lp-role pink">
                    <i className="bi bi-person-badge-fill" />
                    <h3 className="h6">Untuk bidan</h3>
                    <p>
                      Masuk ke dashboard, mencatat pemeriksaan, memantau risiko, dan mengatur jadwal
                      pesan.
                    </p>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="lp-role blue">
                    <i className="bi bi-whatsapp" />
                    <h3 className="h6">Untuk ibu hamil</h3>
                    <p>
                      Cukup menerima pesan di WhatsApp. Tanpa akun, tanpa unduh aplikasi, dan dapat
                      berhenti kapan saja.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Fitur ---------- */}
      <section id="fitur" className="lp-section lp-tint">
        <div className="lp-container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: 640 }}>
            <span className="lp-kicker">Fitur</span>
            <h2 className="lp-h2">Yang Anda butuhkan, tanpa yang tidak perlu</h2>
          </div>
          <div className="row g-4">
            {FITUR.map((f) => (
              <div className="col-md-6 col-lg-4" key={f.judul}>
                <div className="lp-feature">
                  <span className={`ic ${f.warna}`}>
                    <i className={`bi ${f.icon}`} />
                  </span>
                  <h3 className="h6">{f.judul}</h3>
                  <p>{f.isi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Cara kerja ---------- */}
      <section id="cara-kerja" className="lp-section">
        <div className="lp-container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: 640 }}>
            <span className="lp-kicker">Cara kerja</span>
            <h2 className="lp-h2">Dari pemeriksaan ke pesan, dalam empat langkah</h2>
          </div>
          <div className="row g-4">
            {LANGKAH.map((l) => (
              <div className="col-sm-6 col-lg-3" key={l.n}>
                <div className="lp-step">
                  <span className="num">{l.n}</span>
                  <h3 className="h6">{l.judul}</h3>
                  <p>{l.isi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Pesan ---------- */}
      <section className="lp-section lp-tint">
        <div className="lp-container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-5">
              <span className="lp-kicker">Pesan untuk ibu hamil</span>
              <h2 className="lp-h2">Pesan yang menenangkan, bukan menakutkan</h2>
              <p className="text-muted-mg">
                Setiap pesan ditulis dengan nada tenang, memakai nama ibu dan bidan, serta
                mencantumkan nomor bidan untuk bertanya. Tema pesan bergilir agar tidak terasa
                berulang, dan selalu ada cara untuk berhenti menerima pesan.
              </p>
            </div>
            <div className="col-lg-7">
              <div className="d-grid gap-3">
                <div className="lp-msg">
                  <span className="mg-badge mg-info mb-2">Tema: kontrol</span>
                  <div className="wa-bubble">
                    Halo Bu Ani, ini pesan dari Bidan Sari. Mohon tetap datang kontrol sesuai jadwal
                    ya, Bu. Jika ada pertanyaan, hubungi saya di nomor yang tertera. Jika tidak
                    ingin menerima pesan ini, beri tahu Bidan Sari.
                  </div>
                </div>
                <div className="lp-msg right">
                  <span className="mg-badge mg-pink mb-2">Tema: istirahat dan pola hidup</span>
                  <div className="wa-bubble">
                    Halo Bu Ani. Usahakan istirahat cukup, tidur miring ke kiri, makan teratur, dan
                    minum air putih yang cukup. Jika tidak ada keluhan, lanjutkan aktivitas seperti
                    biasa. Salam, Bidan Sari.
                  </div>
                </div>
                <div className="small text-muted-mg">Contoh pesan, nama fiktif.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="lp-section">
        <div className="lp-container" style={{ maxWidth: 820 }}>
          <div className="text-center mb-5">
            <span className="lp-kicker">FAQ</span>
            <h2 className="lp-h2">Pertanyaan yang sering muncul</h2>
          </div>
          <div className="d-grid gap-3">
            {FAQ.map((f) => (
              <details className="lp-faq" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="lp-cta-wrap">
        <div className="lp-container">
          <div className="lp-cta">
            <h2>Mulai memantau ibu hamil binaan Anda</h2>
            <p>Masuk jika sudah punya akun, atau daftar sebagai bidan untuk mencoba.</p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              {loggedIn ? (
                <Link href="/dashboard" className="btn btn-light btn-lg">
                  Buka dashboard
                </Link>
              ) : (
                <>
                  {daftar ? (
                    <Link href="/daftar" className="btn btn-light btn-lg">
                      Daftar sebagai bidan
                    </Link>
                  ) : null}
                  <Link href="/login" className="btn btn-outline-light btn-lg">
                    Masuk
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container d-flex flex-wrap justify-content-between gap-3">
          <div>
            <strong>MaternalGuard</strong>
            <div className="small">
              Peringatan dini preeklamsia untuk bidan. Bukan alat diagnosis.
            </div>
          </div>
          <div className="d-flex gap-3 small align-items-center">
            <Link href="/login">Masuk</Link>
            {daftar ? <Link href="/daftar">Daftar</Link> : null}
            <a href="#faq">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

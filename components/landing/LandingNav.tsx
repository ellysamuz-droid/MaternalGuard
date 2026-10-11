"use client";

import Link from "next/link";
import { useState } from "react";

const MENU = [
  { href: "#tentang", label: "Tentang" },
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#faq", label: "FAQ" },
];

// Client Component hanya untuk buka/tutup menu di HP. Tombol Masuk dan Daftar
// selalu terlihat (di luar menu lipat) agar jelas di semua ukuran layar.
export default function LandingNav({ masuk, daftar }: { masuk: boolean; daftar: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="lp-nav">
      <div className="lp-container d-flex align-items-center gap-3">
        <Link href="/" className="lp-brand">
          <span className="mark">MG</span>
          <span>MaternalGuard</span>
        </Link>

        <nav className={`lp-menu ${open ? "open" : ""}`} aria-label="Navigasi utama">
          {MENU.map((m) => (
            <a key={m.href} href={m.href} onClick={() => setOpen(false)}>
              {m.label}
            </a>
          ))}
        </nav>

        <div className="ms-auto d-flex align-items-center gap-2">
          {masuk ? (
            <Link href="/dashboard" className="btn btn-primary">
              <i className="bi bi-grid-1x2-fill me-2" />
              Buka dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline-primary">
                Masuk
              </Link>
              {daftar ? (
                <Link href="/daftar" className="btn btn-primary">
                  Daftar
                </Link>
              ) : null}
            </>
          )}
          <button
            type="button"
            className="btn btn-outline-primary lp-burger"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <i className={`bi ${open ? "bi-x-lg" : "bi-list"}`} />
          </button>
        </div>
      </div>
    </header>
  );
}

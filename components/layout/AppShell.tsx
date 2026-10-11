"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/lib/actions";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "bi-grid-1x2-fill" },
  { href: "/ibu-hamil/baru", label: "Tambah ibu hamil", icon: "bi-person-plus-fill" },
];

// Client Component karena membutuhkan usePathname (menu aktif) dan state buka/tutup
// sidebar di layar kecil. Halaman di dalamnya tetap Server Component (children).
export default function AppShell({ nama, children }: { nama: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: tutup sidebar setiap rute berubah
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="mg-topbar">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
        >
          <i className="bi bi-list" />
        </button>
        MaternalGuard
      </header>
      <button
        type="button"
        aria-label="Tutup menu"
        tabIndex={open ? 0 : -1}
        className={`mg-scrim border-0 ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`mg-sidebar ${open ? "open" : ""}`}>
        <div className="mg-brand">
          <span className="mark">MG</span>
          MaternalGuard
        </div>
        <nav className="mg-nav">
          {LINKS.map((l) => {
            const aktif = l.href === "/dashboard" ? pathname === l.href : pathname === l.href;
            return (
              <Link key={l.href} href={l.href} className={aktif ? "active" : ""}>
                <i className={`bi ${l.icon}`} />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="mg-user">
          <div className="d-flex align-items-center gap-2 mb-2">
            <i className="bi bi-person-circle fs-4" />
            <div>
              <strong className="d-block">{nama}</strong>
              <span className="text-muted-mg small">Bidan</span>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-outline-pink btn-sm w-100">
              <i className="bi bi-box-arrow-right me-1" /> Keluar
            </button>
          </form>
        </div>
      </aside>
      <main className="mg-main">{children}</main>
    </>
  );
}

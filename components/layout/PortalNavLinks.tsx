"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  {
    href: "/portal",
    label: "Beranda",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    href: "/portal/input",
    label: "Input Data Harian",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/portal/riwayat",
    label: "Riwayat & Grafik Tren",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 3 3 5-6" />
      </svg>
    ),
  },
];

export default function PortalNavLinks() {
  const pathname = usePathname();
  return (
    <nav>
      {LINKS.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link key={link.href} href={link.href} className={isActive ? "active" : ""}>
            {link.icon}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

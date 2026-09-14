import type { Metadata } from "next";
import "./globals.css";

// Poin (g) — Metadata API: objek statis di Root Layout, berlaku sebagai
// fallback/template untuk seluruh rute di bawahnya. Halaman-halaman turunan
// (mis. detail pasien) meng-override sebagian lewat `generateMetadata`.
export const metadata: Metadata = {
  title: {
    default: "MaternalGuard — Dashboard Bidan",
    template: "%s · MaternalGuard",
  },
  description:
    "Dashboard pemantauan risiko kehamilan MaternalGuard untuk bidan/dokter pendamping — deteksi dini hipertensi gestasional & preeklamsia.",
  applicationName: "MaternalGuard",
  robots: { index: false, follow: false }, // dashboard internal, tidak untuk diindeks mesin pencari
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

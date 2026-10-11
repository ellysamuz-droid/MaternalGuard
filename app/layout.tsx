import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: {
    default: "MaternalGuard",
    template: "%s · MaternalGuard",
  },
  description:
    "Web pencatatan pemeriksaan ibu hamil dengan risiko preeklamsia untuk bidan, dengan notifikasi WhatsApp otomatis ke ibu hamil berisiko tinggi.",
  applicationName: "MaternalGuard",
  robots: { index: false, follow: false }, // data kesehatan, tidak untuk diindeks
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

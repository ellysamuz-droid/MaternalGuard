import type { Metadata } from "next";
import Link from "next/link";
import IbuForm from "@/components/ibu/IbuForm";

export const metadata: Metadata = { title: "Tambah Ibu Hamil" };

export default function TambahIbuPage() {
  return (
    <>
      <Link href="/dashboard" className="back-link">
        <i className="bi bi-arrow-left" /> Kembali ke dashboard
      </Link>
      <div className="page-header">
        <div>
          <h1>Tambah ibu hamil binaan</h1>
          <p>Isi data ibu hamil, termasuk nomor WhatsApp dan persetujuan menerima pesan.</p>
        </div>
      </div>
      <div style={{ maxWidth: 820 }}>
        <IbuForm />
      </div>
    </>
  );
}

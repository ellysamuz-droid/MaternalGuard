import type { Metadata } from "next";
import Link from "next/link";
import IbuForm from "@/components/ibu/IbuForm";
import { ibuById } from "@/lib/api/guard";

export const metadata: Metadata = { title: "Ubah Data Ibu Hamil" };

export default async function UbahIbuPage({ params }: { params: { id: string } }) {
  const ibu = await ibuById(Number(params.id));
  return (
    <>
      <Link href={`/ibu-hamil/${ibu.id_ibu}`} className="back-link">
        <i className="bi bi-arrow-left" /> Kembali ke detail
      </Link>
      <div className="page-header">
        <div>
          <h1>Ubah data {ibu.nama}</h1>
          <p>Perbarui data diri, nomor WhatsApp, atau persetujuan pesan.</p>
        </div>
      </div>
      <div style={{ maxWidth: 820 }}>
        <IbuForm ibu={ibu} />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PemeriksaanFlow from "@/components/exam/PemeriksaanFlow";
import PatientBanner from "@/components/ibu/PatientBanner";
import { getJenisKeluhan } from "@/lib/api/endpoints";
import { ambil, ibuById } from "@/lib/api/guard";

export const metadata: Metadata = { title: "Catat Pemeriksaan" };

export default async function PemeriksaanBaruPage({ params }: { params: { id: string } }) {
  const [ibu, jenis] = await Promise.all([
    ibuById(Number(params.id)),
    ambil(() => getJenisKeluhan()),
  ]);
  if (ibu.status_persalinan === "sudah lahir") redirect(`/ibu-hamil/${ibu.id_ibu}`);

  return (
    <>
      <Link href={`/ibu-hamil/${ibu.id_ibu}`} className="back-link">
        <i className="bi bi-arrow-left" /> Kembali ke detail
      </Link>
      <PatientBanner ibu={ibu} />
      <div className="page-header">
        <div>
          <h2 className="h4">Catat pemeriksaan</h2>
          <p>Isi tanda vital dan keluhan. Kategori risiko dihitung otomatis setelah disimpan.</p>
        </div>
      </div>
      <div style={{ maxWidth: 900 }}>
        <PemeriksaanFlow ibu={ibu} jenisKeluhan={jenis} />
      </div>
    </>
  );
}

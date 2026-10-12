import type { Metadata } from "next";
import Link from "next/link";
import PatientBanner from "@/components/ibu/PatientBanner";
import HasilLabForm from "@/components/lab/HasilLabForm";
import { ibuById } from "@/lib/api/guard";

export const metadata: Metadata = { title: "Catat Hasil Lab" };

export default async function HasilLabBaruPage({ params }: { params: { id: string } }) {
  const ibu = await ibuById(Number(params.id));
  return (
    <>
      <Link href={`/ibu-hamil/${ibu.id_ibu}?tab=lab`} className="back-link">
        <i className="bi bi-arrow-left" /> Kembali ke detail
      </Link>
      <PatientBanner ibu={ibu} />
      <div className="page-header">
        <div>
          <h2 className="h4">Catat hasil lab protein urine</h2>
          <p>Hasil disimpan atas nama bidan yang login.</p>
        </div>
      </div>
      <div style={{ maxWidth: 820 }}>
        <HasilLabForm idIbu={ibu.id_ibu} />
      </div>
    </>
  );
}

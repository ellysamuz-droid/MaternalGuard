import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import DataDiri from "@/components/ibu/DataDiri";
import DetailTabs from "@/components/ibu/DetailTabs";
import JadwalPanel from "@/components/ibu/JadwalPanel";
import LabSection from "@/components/ibu/LabSection";
import NotifikasiPanel from "@/components/ibu/NotifikasiPanel";
import PatientBanner from "@/components/ibu/PatientBanner";
import PemeriksaanSection from "@/components/ibu/PemeriksaanSection";
import { ibuById } from "@/lib/api/guard";
import type { DetailTab } from "@/store/useDetailTabStore";

type Props = { params: { id: string }; searchParams: { tab?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ibu = await ibuById(Number(params.id));
  return { title: `${ibu.nama} · Detail ibu hamil` };
}

const TAB_VALID: DetailTab[] = ["data", "pemeriksaan", "lab", "notifikasi", "jadwal"];

function Muat() {
  return <div className="skeleton" style={{ height: 240 }} />;
}

export default async function DetailIbuPage({ params, searchParams }: Props) {
  const ibu = await ibuById(Number(params.id));
  const awal = TAB_VALID.includes(searchParams.tab as DetailTab)
    ? (searchParams.tab as DetailTab)
    : "data";
  const boleh = ibu.status_persalinan === "belum lahir";

  return (
    <>
      <Link href="/dashboard" className="back-link">
        <i className="bi bi-arrow-left" /> Kembali ke dashboard
      </Link>
      <PatientBanner ibu={ibu} />
      {boleh ? (
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Link href={`/ibu-hamil/${ibu.id_ibu}/pemeriksaan/baru`} className="btn btn-primary">
            <i className="bi bi-clipboard2-plus me-2" />
            Catat pemeriksaan
          </Link>
          <Link
            href={`/ibu-hamil/${ibu.id_ibu}/hasil-lab/baru`}
            className="btn btn-outline-primary"
          >
            <i className="bi bi-droplet-half me-2" />
            Catat hasil lab
          </Link>
        </div>
      ) : null}
      <DetailTabs
        awal={awal}
        panels={{
          data: <DataDiri ibu={ibu} />,
          pemeriksaan: (
            <Suspense fallback={<Muat />}>
              <PemeriksaanSection idIbu={ibu.id_ibu} boleh={boleh} />
            </Suspense>
          ),
          lab: (
            <Suspense fallback={<Muat />}>
              <LabSection idIbu={ibu.id_ibu} />
            </Suspense>
          ),
          notifikasi: <NotifikasiPanel idIbu={ibu.id_ibu} />,
          jadwal: <JadwalPanel idIbu={ibu.id_ibu} />,
        }}
      />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatient } from "@/lib/data";
import ExamForm from "@/components/exam/ExamForm";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const patient = await getPatient(params.id);
  return {
    title: patient ? `Catat Periksa · ${patient.name}` : "Catat Hasil Periksa",
    description: "Form pencatatan hasil pemeriksaan manual tekanan darah, nadi, berat, dan keluhan.",
  };
}

export default async function ExamFormPage({ params }: Props) {
  const patient = await getPatient(params.id);
  if (!patient) notFound();

  return (
    <>
      <Link href="/dashboard" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Kembali ke dashboard
      </Link>

      <div className="patient-banner">
        <div className={`avatar ${patient.status}`}>{patient.name.replace("Ibu ", "I")}</div>
        <div className="info">
          <strong>Catat Hasil Periksa Langsung</strong>
          <span>
            {patient.name} &middot; {patient.week} minggu &middot; kunjungan pemeriksaan manual
          </span>
        </div>
      </div>

      <ExamForm patientId={patient.id} />
    </>
  );
}

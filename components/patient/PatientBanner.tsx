import type { Patient } from "@/lib/types";

const STATUS_LABEL: Record<Patient["status"], string> = {
  tinggi: "Risiko tinggi",
  sedang: "Risiko sedang",
  rendah: "Risiko rendah",
};

export default function PatientBanner({ patient }: { patient: Patient }) {
  return (
    <div className="patient-banner">
      <div className={`avatar ${patient.status}`}>{patient.name.replace("Ibu ", "I")}</div>
      <div className="info">
        <strong>
          {patient.name} &middot; {patient.age} tahun &middot; {patient.week} minggu
        </strong>
        <span>
          {patient.puskesmas} &middot; riwayat preeklamsia:{" "}
          {patient.riwayatPreeklamsia ? "ada" : "tidak ada"}
        </span>
      </div>
      <span className={`badge ${patient.status}`}>{STATUS_LABEL[patient.status]}</span>
    </div>
  );
}

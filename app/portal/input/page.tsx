import VitalInputForm from "@/components/portal/VitalInputForm";
import { getSession } from "@/lib/session";

export default function PortalInputPage() {
  const session = getSession();
  if (!session?.patientId) return null;

  return (
    <div className="portal-home">
      <header className="page-title">
        <h1>Input Data Harian</h1>
        <p>Catat kondisi kehamilanmu setiap hari agar bidan dapat memantau lebih dini.</p>
      </header>
      <VitalInputForm patientId={session.patientId} />
    </div>
  );
}

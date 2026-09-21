import PortalHome from "@/components/portal/PortalHome";
import { getSession } from "@/lib/session";

export default function PortalPage() {
  const session = getSession();
  // Dijamin ada oleh app/portal/layout.tsx, tapi TypeScript tetap butuh narrow.
  if (!session?.patientId) return null;

  return <PortalHome patientId={session.patientId} name={session.name} />;
}

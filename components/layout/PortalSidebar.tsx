import type { Session } from "@/lib/types";
import LogoutButton from "./LogoutButton";
import PortalNavLinks from "./PortalNavLinks";

export default function PortalSidebar({ session }: { session: Session }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="mark">MG</span>
        MaternalGuard
      </div>
      <PortalNavLinks />
      <div className="user">
        <strong>{session.name}</strong>
        {session.puskesmas}
        <LogoutButton />
      </div>
    </aside>
  );
}

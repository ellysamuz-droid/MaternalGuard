import type { Session } from "@/lib/types";
import LogoutButton from "./LogoutButton";
import NavLinks from "./NavLinks";
import NotificationBell from "./NotificationBell";

// Server Component: menerima data sesi sebagai prop (sudah dibaca di layout
// lewat getSession()), lalu hanya merender markup statis + tiga leaf client
// yang benar-benar butuh interaktivitas (NavLinks, NotificationBell, LogoutButton).
export default function Sidebar({ session }: { session: Session }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="mark">MG</span>
        MaternalGuard
      </div>
      <NavLinks />
      <NotificationBell />
      <div className="user">
        <strong>{session.name}</strong>
        {session.puskesmas}
        <LogoutButton />
      </div>
    </aside>
  );
}

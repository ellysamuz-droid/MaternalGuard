import type { Session } from "@/lib/types";
import LogoutButton from "./LogoutButton";
import NavLinks from "./NavLinks";

// Server Component: menerima data sesi sebagai prop (sudah dibaca di layout
// lewat getSession()), lalu hanya merender markup statis + dua leaf client
// yang benar-benar butuh interaktivitas (NavLinks, LogoutButton).
export default function Sidebar({ session }: { session: Session }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="mark">MG</span>
        MaternalGuard
      </div>
      <NavLinks />
      <div className="user">
        <strong>{session.name}</strong>
        {session.puskesmas}
        <LogoutButton />
      </div>
    </aside>
  );
}

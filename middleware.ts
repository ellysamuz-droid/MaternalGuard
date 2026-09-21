import { type NextRequest, NextResponse } from "next/server";

// Poin (f) — Middleware Proteksi Rute & Security.
// Middleware berjalan di Edge Runtime SEBELUM request mencapai Server
// Component manapun, sehingga tidak boleh memakai modul Node-only
// ("server-only", next/headers cookies() versi App Router API biasa masih
// boleh dipakai lewat req.cookies). Di sini kita hanya memeriksa KEBERADAAN
// & bentuk cookie sesi (bukan mendekode penuh) untuk menjaga middleware tetap
// ringan — validasi isi sesi yang sesungguhnya tetap dilakukan di server
// (lihat lib/session.ts -> getSession()).

const SESSION_COOKIE = "mg_session";
const BIDAN_PREFIXES = ["/dashboard", "/pasien", "/periksa"];
const IBU_HAMIL_PREFIXES = ["/portal"];
const PROTECTED_PREFIXES = [...BIDAN_PREFIXES, ...IBU_HAMIL_PREFIXES];
const AUTH_PAGES = ["/login"];

function matchesAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthPage(pathname: string) {
  return matchesAny(pathname, AUTH_PAGES);
}

function decodeSessionShape(token: string | undefined): { userId: string; role: string } | null {
  if (!token) return null;
  try {
    const json = Buffer.from(token, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (parsed?.userId && (parsed.role === "bidan" || parsed.role === "ibu_hamil")) {
      return { userId: parsed.userId, role: parsed.role };
    }
    return null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = decodeSessionShape(token);

  if (matchesAny(pathname, PROTECTED_PREFIXES) && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // NFR-06 (least privilege): role bidan tidak boleh masuk /portal, dan
  // sebaliknya role ibu_hamil tidak boleh masuk area bidan.
  if (session?.role === "ibu_hamil" && matchesAny(pathname, BIDAN_PREFIXES)) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }
  if (session?.role === "bidan" && matchesAny(pathname, IBU_HAMIL_PREFIXES)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthPage(pathname) && session) {
    const home = session.role === "ibu_hamil" ? "/portal" : "/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pasien/:path*", "/periksa/:path*", "/portal/:path*", "/login"],
};

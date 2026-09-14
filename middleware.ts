import { NextRequest, NextResponse } from "next/server";

// Poin (f) — Middleware Proteksi Rute & Security.
// Middleware berjalan di Edge Runtime SEBELUM request mencapai Server
// Component manapun, sehingga tidak boleh memakai modul Node-only
// ("server-only", next/headers cookies() versi App Router API biasa masih
// boleh dipakai lewat req.cookies). Di sini kita hanya memeriksa KEBERADAAN
// & bentuk cookie sesi (bukan mendekode penuh) untuk menjaga middleware tetap
// ringan — validasi isi sesi yang sesungguhnya tetap dilakukan di server
// (lihat lib/session.ts -> getSession()).

const SESSION_COOKIE = "mg_session";
const PROTECTED_PREFIXES = ["/dashboard", "/pasien", "/periksa"];
const AUTH_PAGES = ["/login"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasValidSessionShape(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const json = Buffer.from(token, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    return Boolean(parsed?.userId && parsed?.role === "bidan");
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = hasValidSessionShape(token);

  if (isProtected(pathname) && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage(pathname) && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pasien/:path*", "/periksa/:path*", "/login"],
};

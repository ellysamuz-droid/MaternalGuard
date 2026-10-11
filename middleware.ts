import { type NextRequest, NextResponse } from "next/server";
import { isTokenActive } from "@/lib/jwt";

// Proteksi rute: hanya bidan dengan JWT yang belum kedaluwarsa dapat membuka
// halaman aplikasi. Verifikasi tanda tangan tetap dilakukan backend di tiap request.
const TOKEN_COOKIE = "mg_token";
const PROTECTED = ["/dashboard", "/ibu-hamil"];

const cocok = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const aktif = isTokenActive(token);

  if (cocok(pathname, PROTECTED) && !aktif) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    if (token) url.searchParams.set("expired", "1");
    return NextResponse.redirect(url);
  }
  if ((pathname === "/login" || pathname === "/daftar") && aktif) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/ibu-hamil/:path*", "/login", "/daftar"],
};

import { type NextRequest, NextResponse } from "next/server";

// Dipakai saat backend menolak token (401): hapus cookie lalu kembali ke login.
// Server Component tidak boleh menghapus cookie, jadi dilakukan di route handler.
export function GET(request: NextRequest) {
  const expired = request.nextUrl.searchParams.get("expired");
  const res = NextResponse.redirect(new URL(expired ? "/login?expired=1" : "/login", request.url));
  res.cookies.delete("mg_token");
  res.cookies.delete("mg_nama");
  return res;
}

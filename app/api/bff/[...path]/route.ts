import { type NextRequest, NextResponse } from "next/server";
import { ApiError, apiFetch } from "@/lib/api/server";

// Backend-for-frontend: Client Component (TanStack Query) tidak dapat membaca
// cookie httpOnly, jadi memanggil route ini, dan route ini meneruskan ke API
// dengan JWT. Hanya jalur yang dipakai UI klien yang diizinkan.
const ALLOW: { method: string; re: RegExp }[] = [
  { method: "GET", re: /^\/ibu-hamil\/\d+\/notifikasi$/ },
  { method: "GET", re: /^\/ibu-hamil\/\d+\/jadwal-pesan$/ },
  { method: "PATCH", re: /^\/jadwal-pesan\/\d+$/ },
];

async function handle(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = `/${params.path.join("/")}`;
  if (!ALLOW.some((a) => a.method === request.method && a.re.test(path))) {
    return NextResponse.json({ detail: "Jalur tidak diizinkan." }, { status: 404 });
  }
  try {
    const body = request.method === "GET" ? undefined : await request.json();
    const data = await apiFetch<unknown>(request.method as "GET" | "PATCH", path, { body });
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof ApiError)
      return NextResponse.json({ detail: e.message }, { status: e.status });
    return NextResponse.json({ detail: "Terjadi kesalahan." }, { status: 500 });
  }
}

export const GET = handle;
export const PATCH = handle;

// Dipakai di middleware (Edge) dan server. TIDAK memverifikasi tanda tangan:
// verifikasi sebenarnya dilakukan backend pada setiap request. Di front end
// token hanya dibaca untuk mengetahui masa berlaku dan nama bidan (UX).

export interface JwtPayload {
  sub?: string;
  nama?: string;
  exp?: number;
}

export function decodeJwtPayload(token: string | undefined | null): JwtPayload | null {
  if (!token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const b64 = part
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(part.length / 4) * 4, "=");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenActive(token: string | undefined | null): boolean {
  const p = decodeJwtPayload(token);
  if (!p || typeof p.exp !== "number") return false;
  return p.exp * 1000 > Date.now();
}

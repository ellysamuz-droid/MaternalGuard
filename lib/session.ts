import "server-only";
import { cookies } from "next/headers";
import type { Session } from "./api/types";
import { decodeJwtPayload, isTokenActive } from "./jwt";

export const TOKEN_COOKIE = "mg_token";
export const NAMA_COOKIE = "mg_nama";

export function getToken(): string | null {
  const token = cookies().get(TOKEN_COOKIE)?.value;
  return token && isTokenActive(token) ? token : null;
}

/** Sesi bidan dari JWT di cookie httpOnly. Hanya ada satu peran: bidan. */
export function getSession(): Session | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const idBidan = Number(payload?.sub);
  if (!payload || Number.isNaN(idBidan)) return null;
  const nama = cookies().get(NAMA_COOKIE)?.value ?? payload.nama ?? "Bidan";
  return { idBidan, nama };
}

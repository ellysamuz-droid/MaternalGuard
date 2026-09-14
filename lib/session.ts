import "server-only";
import { cookies } from "next/headers";
import type { Session } from "./types";

// ---------------------------------------------------------------------------
// Sesi login disimpan sebagai cookie httpOnly berisi JSON terenkode base64.
// Pada sistem produksi nyata (lihat SRS NFR-01) ini akan digantikan dengan
// JWT bertanda tangan (HMAC/RSA) — di sini disederhanakan agar fokus pada
// pola arsitektur App Router (middleware + Server Actions), bukan kriptografi.
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = "mg_session";

const DUMMY_USERS = [
  {
    email: "bidan@maternalguard.id",
    password: "puskesmas123",
    session: {
      userId: "bidan-01",
      name: "Bidan Siti Aminah",
      role: "bidan" as const,
      puskesmas: "Puskesmas Manguharjo",
    },
  },
];

export function verifyCredentials(email: string, password: string): Session | null {
  const user = DUMMY_USERS.find((u) => u.email === email && u.password === password);
  return user ? user.session : null;
}

export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session), "utf-8").toString("base64url");
}

export function decodeSession(value: string | undefined | null): Session | null {
  if (!value) return null;
  try {
    const json = Buffer.from(value, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.userId === "string") return parsed as Session;
    return null;
  } catch {
    return null;
  }
}

/** Dipakai di Server Components / Server Actions (bukan middleware). */
export function getSession(): Session | null {
  const value = cookies().get(SESSION_COOKIE)?.value;
  return decodeSession(value);
}

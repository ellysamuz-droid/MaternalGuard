import "server-only";
import { getToken } from "../session";
import { handleMock } from "./mock/handler";

// Satu pintu masuk semua panggilan ke backend (Server Component, Server Action,
// dan route handler BFF). API_MODE=mock memakai backend tiruan di memori,
// API_MODE=live memanggil FastAPI di API_BASE_URL.

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const MODE = process.env.API_MODE === "live" ? "live" : "mock";
const BASE = (process.env.API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

type Detail = string | { loc?: (string | number)[]; msg?: string }[] | undefined;

function parseDetail(
  detail: Detail,
  fallback: string,
): { message: string; fields: Record<string, string> } {
  if (typeof detail === "string") return { message: detail, fields: {} };
  if (Array.isArray(detail)) {
    const fields: Record<string, string> = {};
    for (const d of detail) {
      const key = d.loc?.filter((x) => x !== "body").at(-1);
      if (typeof key === "string" && d.msg && !fields[key]) fields[key] = d.msg;
    }
    return { message: fallback, fields };
  }
  return { message: fallback, fields: {} };
}

export async function apiFetch<T>(
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  opts: { query?: Record<string, string | undefined>; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const token = opts.token === undefined ? getToken() : opts.token;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v) qs.set(k, v);

  let status: number;
  let data: unknown;

  if (MODE === "mock") {
    const res = handleMock(
      method,
      path,
      qs,
      (opts.body ?? null) as Record<string, unknown> | null,
      token,
    );
    status = res.status;
    data = res.data;
  } else {
    const url = `${BASE}/api/v1${path}${qs.size ? `?${qs}` : ""}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
    } catch {
      throw new ApiError(503, "Server MaternalGuard tidak dapat dihubungi. Coba lagi sebentar.");
    }
    status = res.status;
    data = await res.json().catch(() => null);
  }

  if (status >= 400) {
    const detail = (data as { detail?: Detail } | null)?.detail;
    const fallback =
      status === 401
        ? "Sesi berakhir, silakan login kembali."
        : status === 403
          ? "Anda tidak berhak mengakses data ini."
          : status === 404
            ? "Data tidak ditemukan."
            : status === 422
              ? "Data yang dikirim belum valid."
              : status === 429
                ? "Terlalu banyak percobaan. Coba lagi nanti."
                : "Terjadi kesalahan pada server.";
    const parsed = parseDetail(detail, fallback);
    throw new ApiError(status, parsed.message, parsed.fields);
  }
  return data as T;
}

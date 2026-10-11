// Dipakai Client Component. Semua panggilan lewat route BFF /api/bff.
export class ClientApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function bff<T>(
  path: string,
  init?: { method?: "GET" | "PATCH"; body?: unknown },
): Promise<T> {
  const res = await fetch(`/api/bff${path}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (res.status === 401) {
    window.location.href = "/logout?expired=1";
    throw new ClientApiError(401, "Sesi berakhir.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok)
    throw new ClientApiError(
      res.status,
      (data as { detail?: string } | null)?.detail ?? "Terjadi kesalahan.",
    );
  return data as T;
}

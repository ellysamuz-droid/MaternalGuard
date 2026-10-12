const TZ = "Asia/Jakarta";

export function formatTanggal(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: value.length <= 10 ? undefined : TZ,
  }).format(d);
}

export function formatWaktu(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d)} WIB`;
}

/** Atribut turunan usia (getUsia pada class diagram). */
export function hitungUsia(tanggalLahir: string, today = new Date()): number {
  const lahir = new Date(`${tanggalLahir}T00:00:00`);
  let usia = today.getFullYear() - lahir.getFullYear();
  const m = today.getMonth() - lahir.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < lahir.getDate())) usia -= 1;
  return usia;
}

/** Usia kehamilan dalam minggu, dihitung dari HPHT. */
export function hitungMingguKehamilan(hpht: string, today = new Date()): number {
  const start = new Date(`${hpht}T00:00:00`);
  const diff = today.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
}

/** Normalisasi nomor WhatsApp ke format internasional 62xxxxxxxx. */
export function normalisasiNoWa(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function isNoWaValid(value: string): boolean {
  return /^62\d{8,13}$/.test(value);
}

export function inisial(nama: string): string {
  return nama
    .replace(/^ibu\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function hariIni(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as api from "./api/endpoints";
import { ApiError } from "./api/server";
import type { HasilPencatatan } from "./api/types";
import { decodeJwtPayload } from "./jwt";
import { loginSchema, zodToFieldErrors } from "./schemas/auth";
import { hasilLabSchema } from "./schemas/hasilLab";
import { ibuHamilSchema, toIbuPayload } from "./schemas/ibuHamil";
import { pemeriksaanSchema, toPemeriksaanPayload } from "./schemas/pemeriksaan";
import { NAMA_COOKIE, TOKEN_COOKIE } from "./session";

export type FormState<T = undefined> = {
  status: "idle" | "error" | "success";
  fieldErrors?: Record<string, string>;
  formError?: string;
  data?: T;
  /** Nilai yang dikirim, dipakai agar isian tidak hilang saat ada error. */
  values?: Record<string, string | string[]>;
};

function rawValues(f: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const k of new Set(f.keys())) {
    if (k === "password" || k.startsWith("$ACTION")) continue;
    const all = f.getAll(k).map(String);
    out[k] = all.length > 1 ? all : (all[0] ?? "");
  }
  return out;
}

/** Ubah ApiError menjadi state form; 401 mengarahkan ke login (sesi berakhir). */
function apiErrorState(e: unknown, f?: FormData): FormState<never> {
  if (e instanceof ApiError) {
    if (e.status === 401) redirect("/logout?expired=1");
    const fieldErrors = Object.keys(e.fieldErrors).length ? e.fieldErrors : undefined;
    return {
      status: "error",
      fieldErrors,
      formError: fieldErrors ? undefined : e.message,
      values: f ? rawValues(f) : undefined,
    };
  }
  throw e;
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

// --- Autentikasi (FR-01) ----------------------------------------------------

function amanPath(from: string): string {
  return from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard";
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: str(formData, "email"),
    password: str(formData, "password"),
  });
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: zodToFieldErrors(parsed.error),
      values: rawValues(formData),
    };

  try {
    const res = await api.login(parsed.data.email, parsed.data.password);
    const exp = decodeJwtPayload(res.access_token)?.exp;
    const maxAge = exp ? Math.max(60, exp - Math.floor(Date.now() / 1000)) : 60 * 60;
    const opt = {
      sameSite: "lax" as const,
      path: "/",
      maxAge,
      secure: process.env.NODE_ENV === "production",
    };
    cookies().set(TOKEN_COOKIE, res.access_token, { ...opt, httpOnly: true });
    cookies().set(NAMA_COOKIE, res.bidan.nama, { ...opt, httpOnly: true });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return {
        status: "error",
        formError: "Email atau kata sandi salah.",
        values: rawValues(formData),
      };
    }
    return apiErrorState(e, formData);
  }
  redirect(amanPath(str(formData, "from")));
}

export async function logoutAction() {
  cookies().delete(TOKEN_COOKIE);
  cookies().delete(NAMA_COOKIE);
  redirect("/login");
}

// --- Ibu hamil (FR-02, FR-11) ----------------------------------------------

export async function simpanIbuAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const idRaw = str(formData, "id_ibu");
  const parsed = ibuHamilSchema.safeParse({
    nama: str(formData, "nama"),
    no_wa: str(formData, "no_wa"),
    tanggal_lahir: str(formData, "tanggal_lahir"),
    alamat: str(formData, "alamat"),
    hpht: str(formData, "hpht"),
    riwayat_status: str(formData, "riwayat_status") || "tidak",
    riwayat_detail: str(formData, "riwayat_detail"),
    riwayat_lain: str(formData, "riwayat_lain"),
    persetujuan_wa: formData.get("persetujuan_wa") === "on",
  });
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: zodToFieldErrors(parsed.error),
      values: rawValues(formData),
    };

  let id: number;
  try {
    const payload = toIbuPayload(parsed.data);
    const saved = idRaw
      ? await api.updateIbuHamil(Number(idRaw), payload)
      : await api.createIbuHamil(payload);
    id = saved.id_ibu;
  } catch (e) {
    return apiErrorState(e, formData);
  }
  revalidatePath("/dashboard");
  revalidatePath(`/ibu-hamil/${id}`);
  redirect(`/ibu-hamil/${id}`);
}

export async function setPersalinanAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = Number(str(formData, "id_ibu"));
  const status = str(formData, "status_persalinan");
  const tanggal = str(formData, "tanggal_persalinan");
  if (status === "sudah lahir" && !tanggal) {
    return {
      status: "error",
      fieldErrors: { tanggal_persalinan: "Tanggal persalinan wajib diisi." },
    };
  }
  try {
    await api.setStatusPersalinan(id, {
      status_persalinan: status,
      tanggal_persalinan: status === "sudah lahir" ? tanggal : null,
    });
  } catch (e) {
    return apiErrorState(e, formData);
  }
  revalidatePath("/dashboard");
  revalidatePath(`/ibu-hamil/${id}`);
  return { status: "success" };
}

// --- Pemeriksaan (FR-05, 07, 08) -------------------------------------------

export async function simpanPemeriksaanAction(
  _prev: FormState<HasilPencatatan>,
  formData: FormData,
): Promise<FormState<HasilPencatatan>> {
  const id = Number(str(formData, "id_ibu"));
  const parsed = pemeriksaanSchema.safeParse({
    sistolik: str(formData, "sistolik"),
    diastolik: str(formData, "diastolik"),
    nadi: str(formData, "nadi"),
    suhu: str(formData, "suhu"),
    gula_darah: str(formData, "gula_darah"),
    berat_badan: str(formData, "berat_badan"),
    id_jenis_keluhan: formData.getAll("id_jenis_keluhan").map(String),
    keluhan_lain: str(formData, "keluhan_lain"),
    tanggal_kontrol_berikutnya: str(formData, "tanggal_kontrol_berikutnya"),
  });
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: zodToFieldErrors(parsed.error),
      values: rawValues(formData),
    };

  try {
    const data = await api.createPemeriksaan(id, toPemeriksaanPayload(parsed.data));
    revalidatePath("/dashboard");
    revalidatePath(`/ibu-hamil/${id}`);
    return { status: "success", data };
  } catch (e) {
    return apiErrorState(e, formData);
  }
}

// --- Hasil lab (FR-06) -------------------------------------------------------

export async function simpanHasilLabAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = Number(str(formData, "id_ibu"));
  const parsed = hasilLabSchema.safeParse({
    tanggal_lab: str(formData, "tanggal_lab"),
    protein_dipstik: str(formData, "protein_dipstik"),
    protein_24jam: str(formData, "protein_24jam"),
    rasio_protein_kreatinin: str(formData, "rasio_protein_kreatinin"),
    catatan: str(formData, "catatan"),
  });
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: zodToFieldErrors(parsed.error),
      values: rawValues(formData),
    };

  try {
    await api.createHasilLab(id, parsed.data);
  } catch (e) {
    return apiErrorState(e, formData);
  }
  revalidatePath(`/ibu-hamil/${id}`);
  redirect(`/ibu-hamil/${id}?tab=lab`);
}

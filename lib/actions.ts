"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitExamResult } from "./data";
import { encodeSession, registerIbuHamil, SESSION_COOKIE, verifyCredentials } from "./session";
import { examSchema, loginSchema, registerSchema, zodIssuesToFieldErrors } from "./validation";

export type LoginState = {
  status: "idle" | "error";
  fieldErrors?: Record<string, string>;
  formError?: string;
};

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", fieldErrors: zodIssuesToFieldErrors(parsed.error) };
  }

  const session = verifyCredentials(parsed.data.email, parsed.data.password);
  if (!session) {
    return { status: "error", formError: "Email atau kata sandi salah." };
  }

  cookies().set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 jam
  });

  redirect(session.role === "ibu_hamil" ? "/portal" : "/dashboard");
}

export type RegisterState = {
  status: "idle" | "error" | "success";
  fieldErrors?: Record<string, string>;
  formError?: string;
};

/** FR-01: Registrasi Akun (khusus Ibu Hamil di sini; akun bidan dibuat manual oleh admin puskesmas). */
export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    patientId: String(formData.get("patientId") ?? ""),
    puskesmas: String(formData.get("puskesmas") ?? "Puskesmas Manguharjo"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", fieldErrors: zodIssuesToFieldErrors(parsed.error) };
  }

  const result = registerIbuHamil(parsed.data);
  if (!result.ok) {
    return { status: "error", formError: result.error };
  }

  return { status: "success" };
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}

export type FollowUpState = { status: "idle" | "success" | "error"; message?: string };

export async function markFollowUpAction(
  _prev: FollowUpState,
  formData: FormData,
): Promise<FollowUpState> {
  const note = String(formData.get("note") ?? "").trim();
  const patientId = String(formData.get("patientId") ?? "");

  if (!note) {
    return { status: "error", message: "Catatan tidak boleh kosong." };
  }

  // Simulasi penyimpanan Data Tindak Lanjut (lihat SRS Bab VI) ke backend.
  await submitExamResult({ kind: "followup", patientId, note, at: new Date().toISOString() });
  return { status: "success", message: "Tindak lanjut berhasil dicatat." };
}

export type ExamState = {
  status: "idle" | "error" | "success";
  fieldErrors?: Record<string, string>;
  formError?: string;
};

export async function submitExamAction(_prev: ExamState, formData: FormData): Promise<ExamState> {
  const temuan: Record<string, boolean> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("temuan.")) temuan[key.replace("temuan.", "")] = value === "on";
  }

  const raw = {
    patientId: String(formData.get("patientId") ?? ""),
    tanggal: String(formData.get("tanggal") ?? ""),
    jam: String(formData.get("jam") ?? ""),
    sistolik: String(formData.get("sistolik") ?? ""),
    diastolik: String(formData.get("diastolik") ?? ""),
    nadi: String(formData.get("nadi") ?? ""),
    berat: String(formData.get("berat") ?? ""),
    catatan: String(formData.get("catatan") ?? ""),
    diagnosis: String(formData.get("diagnosis") ?? ""),
    tindakLanjut: String(formData.get("tindakLanjut") ?? "kontrol"),
    instruksi: String(formData.get("instruksi") ?? ""),
    temuan,
  };

  const parsed = examSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", fieldErrors: zodIssuesToFieldErrors(parsed.error) };
  }

  try {
    await submitExamResult(parsed.data);
    return { status: "success" };
  } catch (err) {
    return {
      status: "error",
      formError: err instanceof Error ? err.message : "Gagal menyimpan catatan periksa.",
    };
  }
}

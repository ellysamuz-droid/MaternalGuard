import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import * as api from "./endpoints";
import { ApiError } from "./server";

/** Dipakai di Server Component: 401 -> login ulang, 404 -> notFound, lainnya -> error.tsx. */
export async function ambil<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) redirect("/logout?expired=1");
      if (e.status === 404 || e.status === 403) notFound();
    }
    throw e;
  }
}

export const ibuById = cache((id: number) => ambil(() => api.getIbuHamil(id)));
export const semuaIbu = cache(() => ambil(() => api.getIbuHamilList()));

"use client";

import { useTransition } from "react";
import { logoutAction } from "@/lib/actions";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      style={{ width: "100%", marginTop: 10, justifyContent: "center" }}
      disabled={isPending}
      onClick={() => startTransition(() => logoutAction())}
    >
      {isPending ? "Keluar..." : "Keluar"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Satu-satunya tempat "use client" untuk kebutuhan TanStack Query.
// `useState` dipakai (bukan variabel modul biasa) supaya setiap sesi
// browser mendapat QueryClient miliknya sendiri, dan instance yang sama
// dipertahankan lintas re-render (tidak dibuat ulang tiap render).
// Membungkus ini di Root Layout TIDAK mengubah page/komponen lain menjadi
// Client Component — children tetap dirender sebagai Server Component,
// hanya "dititipkan" di dalam Provider ini (pola resmi Next.js App Router).
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

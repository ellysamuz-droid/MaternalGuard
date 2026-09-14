import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

// File konvensi Next.js: otomatis membungkus DashboardPage dalam <Suspense>
// pada level navigasi rute (poin e), terpisah dari <Suspense> manual di
// dalam page.tsx yang menstream PatientSection secara terpisah.
export default function Loading() {
  return <DashboardSkeleton />;
}

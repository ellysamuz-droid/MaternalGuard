import { TableSkeleton } from "@/components/dashboard/Skeletons";

export default function Loading() {
  return (
    <>
      <div className="skeleton mb-4" style={{ height: 56, maxWidth: 360 }} />
      <div className="row g-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
          <div className="col-6 col-xl-3" key={i}>
            <div className="skeleton" style={{ height: 86 }} />
          </div>
        ))}
      </div>
      <TableSkeleton />
    </>
  );
}

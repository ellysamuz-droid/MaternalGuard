export function StatGridSkeleton() {
  return (
    <div className="skeleton-stat-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, panjang & urutan tetap
        <div key={i} className="skeleton skeleton-stat-card" />
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="table-card">
      <div className="skeleton skeleton-row" style={{ opacity: 0.6 }} />
      {Array.from({ length: 5 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, panjang & urutan tetap
        <div key={i} className="skeleton skeleton-row" />
      ))}
    </div>
  );
}

// Digunakan langsung sebagai app/(dashboard)/dashboard/loading.tsx
export default function DashboardSkeleton() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="skeleton skeleton-line" style={{ width: 220, height: 22 }} />
          <div className="skeleton skeleton-line" style={{ width: 320 }} />
        </div>
      </div>
      <StatGridSkeleton />
      <TableSkeleton />
    </>
  );
}

export function TableSkeleton() {
  return (
    <div className="card">
      <div className="card-body d-grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
          <div key={i} className="skeleton" style={{ height: 44 }} />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <>
      <div className="skeleton mb-3" style={{ height: 96 }} />
      <div className="skeleton mb-3" style={{ height: 52 }} />
      <div className="skeleton" style={{ height: 260 }} />
    </>
  );
}

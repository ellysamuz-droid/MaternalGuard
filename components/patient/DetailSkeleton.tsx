export default function DetailSkeleton() {
  return (
    <>
      <div className="skeleton skeleton-line" style={{ width: 160, height: 13 }} />
      <div className="skeleton skeleton-block" style={{ height: 76, marginBottom: 20 }} />
      <div className="skeleton-stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-stat-card" />
        ))}
      </div>
      <div className="skeleton skeleton-block" style={{ height: 220, marginBottom: 20 }} />
      <div className="skeleton skeleton-block" style={{ height: 160 }} />
    </>
  );
}

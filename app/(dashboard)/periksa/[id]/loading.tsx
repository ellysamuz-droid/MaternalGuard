export default function Loading() {
  return (
    <>
      <div className="skeleton skeleton-line" style={{ width: 160, height: 13 }} />
      <div className="skeleton skeleton-block" style={{ height: 76, marginBottom: 20 }} />
      <div className="skeleton skeleton-block" style={{ height: 120, marginBottom: 16 }} />
      <div className="skeleton skeleton-block" style={{ height: 90, marginBottom: 16 }} />
      <div className="skeleton skeleton-block" style={{ height: 140 }} />
    </>
  );
}

export default function StatCard({ label, value, tone }) {
  return (
    <div className={`stat-card${tone ? ` ${tone}` : ''}`}>
      <p className="label">{label}</p>
      <p className="value">{value}</p>
    </div>
  );
}

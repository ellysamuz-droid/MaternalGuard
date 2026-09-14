type Tone = "danger" | "warning" | "success" | undefined;

// Server Component murni: tidak ada state, tidak ada event listener.
export default function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: Tone;
}) {
  return (
    <div className={`stat-card${tone ? ` ${tone}` : ""}`}>
      <p className="label">{label}</p>
      <p className="value">{value}</p>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: "rose" | "lavender" | "sage" | "beige";
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone
}: MetricCardProps) {
  return (
    <article className={`metric-card ${tone}`}>
      <span className="metric-icon">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

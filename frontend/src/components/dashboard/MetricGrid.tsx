import "../../styles/components/dashboard.css";
import type { DashboardMetric } from "../../types/dashboard-metric.types";
export function MetricGrid({ metrics, loading = false }: { metrics: DashboardMetric[]; loading?: boolean }) {
  return <div className="metric-grid" aria-busy={loading}>
    {metrics.map((metric) => <article className={`metric-card${metric.emphasis ? " metric-card-emphasis" : ""}`} key={metric.title}>
      <span>{metric.title}</span><strong>{loading ? "…" : metric.value ?? "—"}</strong><small>{metric.note}</small>
    </article>)}
  </div>;
}

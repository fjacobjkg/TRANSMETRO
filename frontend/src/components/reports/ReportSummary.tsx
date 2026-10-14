import "../../styles/components/dashboard.css";
export function ReportSummary({ statistics, formatNumber }: {
  statistics: Array<{ title: string; value: unknown }>; formatNumber: (value: unknown) => string;
}) {
  if (!statistics.length) return null;
  return <div className="report-summary-grid" data-metric-count={statistics.length}>{statistics.map(({ title, value }) =>
    <article className="metric-card" key={title}><span>{title}</span><strong>{formatNumber(value)}</strong></article>)}
  </div>;
}

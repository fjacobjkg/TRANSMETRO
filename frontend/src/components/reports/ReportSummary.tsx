import "../../styles/components/dashboard.css";
export function ReportSummary({ statistics, formatNumber }: {
  statistics: Array<{ title: string; value: unknown; note?: string }>; formatNumber: (value: unknown) => string;
}) {
  if (!statistics.length) return null;
  return <div className="report-summary-grid" data-metric-count={statistics.length}>{statistics.map(({ title, value, note }) =>
    <article className="metric-card" key={title}><span>{title}</span><strong>{formatNumber(value)}</strong>{note && <small>{note}</small>}</article>)}
  </div>;
}

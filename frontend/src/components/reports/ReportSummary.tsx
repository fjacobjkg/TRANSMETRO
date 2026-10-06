export function ReportSummary({ statistics, formatNumber }: {
  statistics: Array<{ title: string; value: unknown }>; formatNumber: (value: unknown) => string;
}) {
  if (!statistics.length) return null;
  return <div className="metric-grid">{statistics.map(({ title, value }) =>
    <article className="metric-card" key={title}><span>{title}</span><strong>{formatNumber(value)}</strong></article>)}
  </div>;
}

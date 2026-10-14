import type { ReactNode } from "react";

export function ReportView({ title, description, filters, metrics, children, enabled = true }: {
  title: string; description: string; filters: ReactNode; metrics: ReactNode; children: ReactNode; enabled?: boolean;
}) {
  if (!enabled) return <>{filters}{metrics}{children}</>;
  return <div className="report-view">
    <header className="report-view-heading"><h2>{title}</h2><p>{description}</p></header>
    {filters}
    {metrics}
    {children}
  </div>;
}

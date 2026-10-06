import type { ReactNode } from "react";
export function OperationCard({ eyebrow, title, icon, children, className = "" }: {
  eyebrow: string; title: string; icon: string; children: ReactNode; className?: string;
}) {
  return <article className={`work-card ${className}`.trim()}>
    <header className="work-card-heading"><div><span className="section-kicker">{eyebrow}</span><h3>{title}</h3></div>
      <span className="work-icon" aria-hidden="true">{icon}</span></header>{children}
  </article>;
}

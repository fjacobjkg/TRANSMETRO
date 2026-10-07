import { Link } from "react-router-dom";
import "../../styles/components/dashboard.css";
import type { UserRole } from "../../types/auth";
import { getPanelsByRole } from "../../utils/role-routing";
import { PanelIcon } from "../ui/PanelIcon";

export function QuickActions({ role }: { role: UserRole }) {
  return <article className="panel">
    <span className="eyebrow-text">ACCESOS DIRECTOS</span><h2>Tu espacio de trabajo</h2>
    <div className="dashboard-quick-actions">
      {getPanelsByRole(role).filter((panel) => panel.id !== "home").map((panel) => <Link key={panel.id} to={panel.path}>
        <span className="dashboard-quick-action-icon"><PanelIcon id={panel.icon} size={17} /></span><strong>{panel.title}</strong><span aria-hidden="true">→</span>
      </Link>)}
    </div>
  </article>;
}

import { NavLink } from "react-router-dom";
import { SidebarIcon } from "./SidebarIcon";
import type { Panel } from "../types/navigation.types";
import type { UserRole } from "../types/auth";

interface SidebarNavigationProps {
  panels: Panel[];
  role: UserRole;
  onNavigate: () => void;
}

export function SidebarNavigation({ panels, role, onNavigate }: SidebarNavigationProps) {
  const groups = Array.from(new Set(panels.map((panel) => panel.group)));
  return (
    <nav className="sidebar-nav" aria-label="Navegación principal">
      {groups.map((group, index) => (
        <section className="sidebar-nav-group" key={group} aria-labelledby={`sidebar-group-${index}`}>
          <h2 className="workspace-caption" id={`sidebar-group-${index}`}>{group}</h2>
          {panels.filter((panel) => panel.group === group).map((panel) => (
            <NavLink key={panel.id} end to={panel.path}
              className={({ isActive }) => `nav-item ${isActive ? "nav-active" : ""}`}
              onClick={onNavigate}>
              <span className="nav-icon"><SidebarIcon id={panel.id} role={role} /></span>
              <span>{panel.title}</span>
            </NavLink>
          ))}
        </section>
      ))}
    </nav>
  );
}

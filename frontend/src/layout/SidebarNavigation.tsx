import { NavLink } from "react-router-dom";
import { PanelIcon } from "../components/ui/PanelIcon";
import type { Panel } from "../types/navigation.types";

interface SidebarNavigationProps {
  panels: Panel[];
  onNavigate: () => void;
}

export function SidebarNavigation({ panels, onNavigate }: SidebarNavigationProps) {
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
              <span className="nav-icon"><PanelIcon id={panel.icon} /></span>
              <span>{panel.title}</span>
            </NavLink>
          ))}
        </section>
      ))}
    </nav>
  );
}

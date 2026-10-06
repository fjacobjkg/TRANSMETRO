import { NavLink } from "react-router-dom";

import { PanelIcon } from "../components/ui/PanelIcon";

import type {
  Panel,
} from "../types/navigation.types";

interface SidebarNavigationProps {
  panels: Panel[];
  onNavigate: () => void;
}

export function SidebarNavigation({
  panels,
  onNavigate,
}: SidebarNavigationProps) {
  return (
    <nav
      className="sidebar-nav"
      aria-label="Navegación principal"
    >
      {panels.map((panel) => (
        <NavLink
          key={panel.id}
          end
          to={panel.path}
          className={({ isActive }) =>
            `nav-item ${
              isActive
                ? "nav-active"
                : ""
            }`
          }
          onClick={onNavigate}
        >
          <span className="nav-icon">
            <PanelIcon
              id={panel.icon}
            />
          </span>

          <span>
            {panel.title}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
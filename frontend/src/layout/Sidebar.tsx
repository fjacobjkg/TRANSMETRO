import { BrandLogo } from "../components/BrandLogo";

import type { AuthUser } from "../types/auth";
import type { Panel } from "../types/navigation.types";

import { SidebarAccount } from "./SidebarAccount";
import { SidebarNavigation } from "./SidebarNavigation";

interface SidebarProps {
  panels: Panel[];
  user: AuthUser;
  open: boolean;
  loggingOut: boolean;
  serviceAvailable: boolean;
  healthError: boolean;
  onNavigate: () => void;
  onLogout: () => void;
}

export function Sidebar({
  panels,
  user,
  open,
  loggingOut,
  serviceAvailable,
  healthError,
  onNavigate,
  onLogout,
}: SidebarProps) {
  return (
    <aside
      className={`sidebar ${open ? "sidebar-open" : ""}`}
      aria-label="Navegación de Transmetro"
    >
      <div className="sidebar-main">
        {/* Marca */}
        <div className="sidebar-brand">
          <BrandLogo />
          
          <button
            type="button"
            className="sidebar-close"
            aria-label="Cerrar menú"
            onClick={onNavigate}
          >
            ×
          </button>
        </div>

        {/* Área de navegación */}
        <div className="sidebar-navigation-area">
<SidebarNavigation
            panels={panels}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* Usuario */}
      <SidebarAccount
        user={user}
        loggingOut={loggingOut}
        serviceAvailable={serviceAvailable}
        healthError={healthError}
        onLogout={onLogout}
      />
    </aside>
  );
}
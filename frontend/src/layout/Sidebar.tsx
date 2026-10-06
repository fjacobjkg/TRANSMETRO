import { BrandLogo } from "../components/BrandLogo";
import type { AuthUser } from "../types/auth";
import type { Panel } from "../types/navigation.types";
import { SidebarAccount } from "./SidebarAccount";
import { SidebarNavigation } from "./SidebarNavigation";
export function Sidebar({ panels, user, open, loggingOut, serviceAvailable, healthError, onNavigate, onLogout }: {
  panels: Panel[]; user: AuthUser; open: boolean; loggingOut: boolean; serviceAvailable: boolean;
  healthError: boolean; onNavigate: () => void; onLogout: () => void;
}) {
  return <aside className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label="Navegación de Transmetro">
    <div className="sidebar-brand"><BrandLogo /><span className="version-chip">V1</span></div>
    <p className="workspace-caption">CENTRO DE OPERACIONES</p>
    <SidebarNavigation panels={panels} onNavigate={onNavigate} />
    <SidebarAccount user={user} loggingOut={loggingOut} serviceAvailable={serviceAvailable}
      healthError={healthError} onLogout={onLogout} />
  </aside>;
}

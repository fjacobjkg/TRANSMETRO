import { LogOut } from "lucide-react";
import { roleLabel } from "../utils/role-routing";
import type { AuthUser } from "../types/auth";
export function SidebarAccount({ user, loggingOut, serviceAvailable, healthError, onLogout }: {
  user: AuthUser; loggingOut: boolean; serviceAvailable: boolean; healthError: boolean; onLogout: () => void;
}) {
  const status = serviceAvailable ? "API y base de datos conectadas"
    : healthError ? "API o base de datos no disponible" : "Verificando servicio";
  return <div className="sidebar-foot">
    <div className="system-status" role="status">
      <span className={`status-dot ${serviceAvailable ? "online" : ""}`} /><span>{status}</span>
    </div>
    <div className="session-card">
      <span className="avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
      <div><small>SESIÓN ACTUAL</small><strong>{user.name}</strong><span>{roleLabel(user.role)}</span></div>
    </div>
    <button type="button" className="logout-button" disabled={loggingOut} onClick={onLogout}>
      <LogOut size={15} aria-hidden="true" />{loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  </div>;
}

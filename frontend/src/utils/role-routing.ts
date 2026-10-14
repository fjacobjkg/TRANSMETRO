import type { UserRole } from "../types/auth";
import type { Panel } from "../types/navigation.types";
import { isFrontendRoleEnabled, FEATURES, type FeatureSettings } from "../config/features";

const prefixes: Record<UserRole, string> = {
  ADMIN: "/admin", ADMINISTRATIVO: "/administrativo", OPERADOR_ESTACION: "/operador",
};
const items: Record<string, string> = {
  home: "Inicio", users: "Cuentas y roles", transport: "Red de transporte",
  personnel: "Personal y seguridad", "security-access": "Seguridad y accesos", fleet: "Flota y parqueos",
  operations: "Operación", reports: "Consultas y reportes", audit: "Bitácora", "access-counts": "Resumen de accesos",
};
const modules: Record<UserRole, string[]> = {
  ADMIN: ["home", "transport", "fleet", "users", "personnel", "security-access", "operations", "reports", "audit"],
  ADMINISTRATIVO: ["home", "transport", "personnel", "fleet", "reports"],
  OPERADOR_ESTACION: ["home", "operations", "access-counts"],
};
export function getHomeRouteByRole(role: UserRole) { return prefixes[role] + "/dashboard"; }
export function getPanelsByRole(role: UserRole, features: FeatureSettings = FEATURES): Panel[] {
  if (!isFrontendRoleEnabled(role, features)) return [];
  return modules[role].map((id) => ({
    id, icon: id === "access-counts" ? "reports" : id === "security-access" ? "personnel" : id,
    title: role === "OPERADOR_ESTACION" && id === "operations" ? "Recorridos"
      : role === "ADMIN" && id === "operations" ? "Seguimiento operativo"
      : role === "ADMIN" && id === "personnel" ? "Personal"
      : role === "ADMINISTRATIVO" && id === "personnel" ? "Personal y accesos" : items[id],
    group: id === "home" ? "Centro de operaciones"
      : role === "OPERADOR_ESTACION" ? (id === "operations" ? "Operación" : "Control de accesos")
      : role === "ADMINISTRATIVO" ? (id === "reports" ? "Información" : "Consulta operativa")
      : ["transport", "fleet"].includes(id) ? "Configuración operativa"
      : ["users", "personnel", "security-access"].includes(id) ? "Administración" : "Información y control",
    path: prefixes[role] + "/" + (id === "home" ? "dashboard" : id),
  }));
}
export function roleLabel(role?: UserRole): string {
  if (!role) return "Usuario";
  return { ADMIN: "Administrador", ADMINISTRATIVO: "Administrativo", OPERADOR_ESTACION: "Operador de estación" }[role];
}

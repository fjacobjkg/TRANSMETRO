import type { UserRole } from "../types/auth";
import type { Panel } from "../types/navigation.types";

const prefixes: Record<UserRole, string> = {
  ADMIN: "/admin", ADMINISTRATIVO: "/administrativo", OPERADOR_ESTACION: "/operador",
};
const items: Record<string, string> = {
  home: "Inicio", users: "Cuentas y roles", transport: "Red de transporte",
  personnel: "Personal y seguridad", fleet: "Flota y parqueos",
  operations: "Operación", reports: "Consultas y reportes", audit: "Bitácora",
};
const modules: Record<UserRole, string[]> = {
  ADMIN: ["home", "users", "transport", "personnel", "fleet", "operations", "reports", "audit"],
  ADMINISTRATIVO: ["home", "transport", "personnel", "fleet", "reports"],
  OPERADOR_ESTACION: ["home", "operations"],
};
export function getHomeRouteByRole(role: UserRole) { return prefixes[role] + "/dashboard"; }
export function getPanelsByRole(role: UserRole): Panel[] {
  return modules[role].map((id) => ({
    id, icon: id, title: items[id],
    path: prefixes[role] + "/" + (id === "home" ? "dashboard" : id),
  }));
}
export function roleLabel(role?: UserRole): string {
  if (!role) return "Usuario";
  return { ADMIN: "Administrador", ADMINISTRATIVO: "Administrativo", OPERADOR_ESTACION: "Operador de estación" }[role];
}

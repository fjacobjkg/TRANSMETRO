export interface FeatureSettings {
  readonly administrativeRole: boolean;
}

// Change to true and rebuild to restore the preserved Administrative UI.
export const FEATURES = {
  administrativeRole: false,
} as const satisfies FeatureSettings;

export function isFrontendRoleEnabled(role: string, features: FeatureSettings = FEATURES): boolean {
  return role.trim().toUpperCase() !== "ADMINISTRATIVO" || features.administrativeRole;
}

export function enabledRoleOptions<T extends { value: string }>(options: T[], features: FeatureSettings = FEATURES): T[] {
  return options.filter(option => isFrontendRoleEnabled(option.value, features));
}

function roleName(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const role = value as Record<string, unknown>;
    const name = role.nombre ?? role.name;
    if (typeof name === "string") return name;
  }
  return undefined;
}

// Keep API records intact; only omit disabled profiles from presentation.
export function enabledCatalogRows<T extends Record<string, unknown>>(
  resourceKey: string, rows: T[], features: FeatureSettings = FEATURES,
): T[] {
  return rows.filter(row => {
    const role = roleName(row.role ?? row.rol ?? (resourceKey === "roles" ? row.nombre ?? row.name : undefined));
    if (role && !isFrontendRoleEnabled(role, features)) return false;
    if (resourceKey === "audit") {
      const actor = row.usuario as Record<string, unknown> | undefined;
      const actorRole = roleName(actor?.role ?? actor?.rol);
      if (actorRole && !isFrontendRoleEnabled(actorRole, features)) return false;
      // Existing audit descriptions can contain a historical role name.
      const mentionedRoles = String(row.descripcion ?? "").match(/\bADMINISTRATIVO\b/gi) ?? [];
      if (mentionedRoles.some(name => !isFrontendRoleEnabled(name, features))) return false;
    }
    return true;
  });
}

export function catalogPageMessage(
  resourceKey: string, rows: Record<string, unknown>[], total?: number, features: FeatureSettings = FEATURES,
): string {
  if (!total || total <= rows.length) return "";
  if (!features.administrativeRole && ["users", "update-user", "roles", "operators", "audit"].includes(resourceKey)) {
    // The API total includes hidden records; do not present it as a visible total.
    return `Se muestran ${enabledCatalogRows(resourceKey, rows, features).length} registros visibles de la página cargada.`;
  }
  return `Se muestran los primeros ${rows.length} registros de ${total}.`;
}

export const DISABLED_ROLE_MESSAGE = "Este perfil está temporalmente deshabilitado en la interfaz de demostración.";

import type { Field, Resource } from "../../types/catalog.types";
import type { Row } from "../../types/table.types";

export interface CatalogContextAction {
  resourceKey: string;
  label: string | ((row: Row) => string);
  formTitle?: string;
  initialValues?: Record<string, string>;
  valuesFromRow?: (row: Row) => Record<string, string>;
  allowedOptions?: Record<string, string[]>;
}

export interface CatalogView {
  title: string;
  description: string;
  resourceKeys: string[];
  rowActions: Record<string, CatalogContextAction[]>;
  createActions?: Record<string, CatalogContextAction>;
  createLabels?: Record<string, string>;
}

export const personnelView: CatalogView = {
  title: "Personal",
  description: "Administra la información del personal operativo y sus asignaciones.",
  resourceKeys: ["pilots", "operators"],
  createLabels: { pilots: "＋ Crear piloto" },
  createActions: { operators: {
    resourceKey: "users", label: "＋ Crear operador", formTitle: "Crear operador",
    initialValues: { role: "OPERADOR_ESTACION" }, allowedOptions: { role: ["OPERADOR_ESTACION"] },
  } },
  rowActions: { operators: [{
    resourceKey: "assign-operator", label: "Asignar estación", formTitle: "Asignar estación",
    valuesFromRow: row => ({ userId: String(row.id_usuario) }),
  }] },
};

export const securityAccessView: CatalogView = {
  title: "Seguridad y accesos",
  description: "Administra la cobertura de seguridad y los accesos habilitados en las estaciones.",
  resourceKeys: ["guards", "accesses", "media"],
  createLabels: { guards: "＋ Crear guardia", accesses: "＋ Crear acceso", media: "＋ Crear medio" },
  rowActions: {
    guards: [{ resourceKey: "assign-guard", label: "Asignar acceso", formTitle: "Asignar acceso",
      valuesFromRow: row => ({ guardId: String(row.id_guardia) }) }],
    accesses: [{ resourceKey: "enable-access", label: row => row.activo === true ? "Deshabilitar" : "Habilitar",
      formTitle: "Cambiar estado del acceso",
      valuesFromRow: row => ({ accessId: String(row.id_acceso), active: row.activo === true ? "false" : "true" }) }],
    media: [{ resourceKey: "station-media", label: "Habilitar en estación", formTitle: "Habilitar en estación",
      initialValues: { active: "true" }, valuesFromRow: row => ({ mediaId: String(row.id_medio_acceso) }) }],
  },
};

// Presentation-only adaptation: keep the existing endpoint, method and payload builder.
export function contextFormResource(action: CatalogContextAction, resources: Resource[]): Resource | undefined {
  const source = resources.find(resource => resource.key === action.resourceKey);
  if (!source) return undefined;
  const fields: Field[] | undefined = source.fields?.map(field => {
    const allowed = action.allowedOptions?.[field.name];
    return allowed ? { ...field, options: field.options?.filter(option => allowed.includes(option.value)) } : field;
  });
  return { ...source, title: action.formTitle ?? source.title, fields };
}

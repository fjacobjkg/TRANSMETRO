import type { CatalogView } from "./administration";

export const transportView: CatalogView = {
  title: "Red de transporte",
  description: "Administra la estructura de líneas, estaciones y recorridos configurados.",
  resourceKeys: ["municipalities", "lines", "stations"],
  createLabels: { municipalities: "＋ Crear municipalidad", lines: "＋ Crear línea", stations: "＋ Crear estación" },
  inactiveLabels: { lines: "En preparación" },
  rowActions: { lines: [
    { resourceKey: "line-stations", label: "Configurar estaciones", formTitle: "Configurar estaciones",
      valuesFromRow: row => ({ lineId: String(row.id_linea) }) },
    { resourceKey: "activate-line", label: row => row.activo === true ? "Desactivar" : "Activar",
      formTitle: "Cambiar estado de la línea",
      valuesFromRow: row => ({ lineId: String(row.id_linea), active: row.activo === true ? "false" : "true" }) },
  ] },
};

export const transportLineViewTab = { key: "line-view", title: "Vista de líneas" };

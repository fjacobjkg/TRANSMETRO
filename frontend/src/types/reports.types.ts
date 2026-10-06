export const reportKinds = [
  { id: "operations", title: "Visitas y demanda" },
  { id: "access-counts", title: "Conteos por medio" },
  { id: "fleet", title: "Historial de flota" },
  { id: "network", title: "Mapa de líneas" },
] as const;
export type ReportKind = typeof reportKinds[number]["id"];

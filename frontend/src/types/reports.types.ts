export const reportKinds = [
  { id: "operations", title: "Visitas y demanda" },
  { id: "access-counts", title: "Conteos por medio" },
  { id: "fleet", title: "Historial de flota" },
  { id: "network", title: "Mapa de líneas" },
] as const;
export type ReportKind = typeof reportKinds[number]["id"];
export type ReportTabKind = ReportKind | "payment-simulation";

export function getReportTabs({ showNetwork = true, paymentSimulation = false }: {
  showNetwork?: boolean; paymentSimulation?: boolean;
} = {}): Array<{ id: ReportTabKind; title: string }> {
  return reportKinds.filter(item => showNetwork || item.id !== "network").map(item => {
    if (!paymentSimulation) return item;
    if (item.id === "access-counts") return { id: "payment-simulation", title: "Recaudación estimada" };
    return { ...item, title: item.id === "operations" ? "Operación registrada"
      : item.id === "fleet" ? "Asignaciones de flota" : item.title };
  });
}

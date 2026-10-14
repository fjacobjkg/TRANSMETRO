import { Badge, type Column } from "../ui/DataTable";
import type { ReportKind } from "../../types/reports.types";

export function getReportColumns(kind: ReportKind, friendlyLabels = false): Column[] {
  const columns: Column[] = kind === "operations" ? [
    { key: "fecha", label: "Fecha", render: (row) => new Date(String(row.fecha)).toLocaleString("es-GT") },
    { key: "linea", label: "Línea" }, { key: "estacion", label: "Estación" }, { key: "bus", label: "Bus" },
    { key: "ocupacion", label: "Ocupación" }, { key: "demanda", label: "Demanda" },
    { key: "alerta", label: "Unidad adicional", render: (row) => row.alerta ? <span className="badge badge-warn">Requerida</span> : "No" },
    { key: "espera", label: "Espera (min)" }, { key: "fuente", label: "Base de evaluación" },
  ] : kind === "fleet" ? [
    { key: "bus", label: "Bus" }, { key: "tipo", label: "Asignación" }, { key: "destino", label: "Destino" },
    { key: "inicio", label: "Desde", render: (row) => new Date(String(row.inicio)).toLocaleString("es-GT") },
    { key: "fin", label: "Hasta", render: (row) => row.fin ? new Date(String(row.fin)).toLocaleString("es-GT") : <Badge value="EN_CURSO" /> },
  ] : [
    { key: "station", label: "Estación" }, { key: "medium", label: "Medio" },
    { key: "quantity", label: "Total de accesos" }, { key: "records", label: "Registros" },
  ];
  if (!friendlyLabels) return columns;
  const labels: Record<string, string> = {
    ocupacion: "Personas a bordo", demanda: "Personas esperando", espera: "Espera adicional (min)", tipo: "Tipo de asignación",
  };
  return columns.map(column => ({ ...column, label: labels[column.key] ?? column.label }));
}

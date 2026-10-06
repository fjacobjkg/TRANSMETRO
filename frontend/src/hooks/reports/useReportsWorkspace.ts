import { useEffect, useMemo, useState, type FormEvent } from "react";
import { textValue } from "../../utils/table-format";
import type { Row } from "../../types/table.types";
import { getFilteredReport, getReport, getReportLookups } from "../../services/reports/reports.service";
import type { ReportKind } from "../../types/reports.types";

const formatNumber = (value: unknown) => Number(value ?? 0).toLocaleString("es-GT", { maximumFractionDigits: 2 });
export function useReportsWorkspace() {
  const [kind, setKind] = useState<ReportKind>("operations");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Row>({});
  const [lookups, setLookups] = useState<Record<string, Row[]>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getReportLookups(controller.signal).then(setLookups)
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setFilters({}); setResult({}); setError("");
    if (kind === "network") { setBusy(false); return; }
    const controller = new AbortController();
    setBusy(true);
    void getReport(kind, controller.signal).then(setResult)
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [kind]);

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (filters.from && filters.to && filters.from > filters.to) {
      setError("La fecha inicial debe ser anterior a la final.");
      return;
    }
    setBusy(true);
    try { setResult(await getFilteredReport(kind, filters)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo generar el reporte."); }
    finally { setBusy(false); }
  }

  const raw = (result.items ?? []) as Row[];
  const rows = useMemo<Row[]>(() => {
    if (kind === "operations") return raw.map((row) => ({
      fecha: row.fecha_hora, estacion: textValue(row.estacion),
      linea: textValue((row.recorrido as Row)?.linea), bus: textValue((row.recorrido as Row)?.bus),
      ocupacion: row.ocupacion, demanda: row.demanda, alerta: row.alerta_unidad_adicional,
      espera: row.espera_adicional_minutos,
      fuente: row.evaluationSource === "recorded" ? "Capacidad registrada" : "Capacidad actual (estimada)",
    }));
    if (kind === "fleet") return raw.flatMap((bus) => [
      ...((bus.asignaciones_linea ?? []) as Row[]).map((assignment) => ({
        bus: bus.codigo, tipo: "Línea", destino: textValue(assignment.linea), inicio: assignment.fecha_inicio, fin: assignment.fecha_fin,
      })),
      ...((bus.asignaciones_parqueo ?? []) as Row[]).map((assignment) => ({
        bus: bus.codigo, tipo: "Parqueo", destino: textValue(assignment.parqueo), inicio: assignment.fecha_inicio, fin: assignment.fecha_fin,
      })),
    ]);
    return raw;
  }, [kind, raw]);


  const summary = (result.summary ?? {}) as Row;
  const statistics: Array<{ title: string; value: unknown }> = kind === "operations"
    ? [
      { title: "Visitas", value: summary.visits }, { title: "Demanda total", value: summary.demandTotal },
      { title: "Alertas de unidad", value: summary.extraUnitAlerts }, { title: "Visitas con espera", value: summary.additionalWaitVisits },
    ]
    : kind === "access-counts"
      ? [{ title: "Accesos registrados", value: result.totalQuantity }, { title: "Registros de conteo", value: result.totalRecords }]
      : [];
  return { kind, setKind, filters, setFilters, result, lookups, error, busy, apply, rows, summary, statistics, formatNumber };
}

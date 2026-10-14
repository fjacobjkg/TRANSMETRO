import { useMemo, useState, type FormEvent } from "react";
import { useTripAccessSummary } from "../../hooks/operations/useTripAccessSummary";
import { paymentCurrency, paymentSimulationLookups, paymentSimulationRows, paymentSimulationTotals,
  revenueCsvHeaders, revenueCsvRows, type PaymentSimulationRow } from "../../utils/payment-simulation-report";
import { Button } from "../ui/Button";
import { DataTable, type Column } from "../ui/DataTable";
import { Notice } from "../ui/PageHeader";
import { ReportFilters } from "./ReportFilters";
import { ReportSummary } from "./ReportSummary";
import { downloadCsv } from "../../utils/csv";
import { ReportView } from "./ReportView";

const columns: Column[] = [
  { key: "date", label: "Fecha", render: row => new Date(String(row.date)).toLocaleString("es-GT", { timeZone: "America/Guatemala" }) },
  { key: "line", label: "Línea" }, { key: "bus", label: "Bus" }, { key: "reference", label: "Recorrido" },
  { key: "stationsServed", label: "Estaciones atendidas" }, { key: "accesses", label: "Accesos estimados" },
  { key: "medium", label: "Medio de pago" },
  { key: "referenceTotal", label: "Recaudación estimada", render: row => paymentCurrency(row.referenceTotal as string | null) },
];
const stationColumns: Column[] = [
  { key: "name", label: "Estación" }, { key: "accesses", label: "Personas en espera / accesos estimados" },
  { key: "medium", label: "Medio de pago", render: row => String(row.medium ?? row.configurationIssue ?? "Sin medio de pago principal") },
  { key: "tariff", label: "Tarifa aplicada", render: row => row.tariff == null ? "—" : paymentCurrency(String(row.tariff)) },
  { key: "referenceTotal", label: "Recaudación estimada", render: row => paymentCurrency(row.referenceTotal as string | null) },
];
const formatNumber = (value: unknown) => typeof value === "string" ? value : Number(value).toLocaleString("es-GT");

export function PaymentSimulationReport() {
  const source = useTripAccessSummary();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [filterError, setFilterError] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);
  const lookups = useMemo(() => paymentSimulationLookups(source.trips), [source.trips]);
  const rows = useMemo(() => paymentSimulationRows(source.trips, appliedFilters), [source.trips, appliedFilters]);
  const totals = paymentSimulationTotals(rows);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (filters.from && filters.to && filters.from > filters.to) {
      setFilterError("La fecha inicial debe ser anterior a la final."); return;
    }
    setFilterError(""); setAppliedFilters({ ...filters }); setSelectedDetail(null);
  }

  return <ReportView title="Recaudación estimada"
    description="Consulta los accesos estimados y el resumen de recaudación por recorrido finalizado."
    filters={<><Notice error={source.error || filterError} />
      <ReportFilters kind="payment-simulation" filters={filters} lookups={lookups} busy={source.loading || Boolean(source.error)}
        onChange={(name, value) => setFilters(current => ({ ...current, [name]: value }))} onSubmit={apply} /></>}
    metrics={!source.error && <ReportSummary statistics={[
      { title: "Recorridos consultados", value: source.loading ? "…" : totals.trips },
      { title: "Accesos estimados", value: source.loading ? "…" : totals.accesses },
      { title: "Recaudación estimada", value: source.loading ? "…" : paymentCurrency(totals.referenceTotal) },
    ]} formatNumber={formatNumber} />}>
    <p className="muted report-caption">Accesos después del molinete, según el medio principal y la tarifa actuales. Valores referenciales, sin cobros reales. Fechas de inicio en hora de Guatemala.</p>
    {!source.loading && !source.error && totals.missingPayments > 0 && <div className="notice notice-warning">
      {totals.missingPayments} visitas sin configuración de pago completa. Sus accesos se incluyen; la recaudación disponible es parcial.
    </div>}
    {!source.error && <article className="panel report-results">
      <div className="panel-heading"><h3>Resumen por recorrido</h3>
        <Button variant="secondary" disabled={source.loading || !rows.length} onClick={() => downloadCsv("transmetro-recaudacion-recorridos.csv",
          revenueCsvHeaders, revenueCsvRows(rows))}>
          ↓ Exportar CSV
        </Button></div>
      {!source.loading && !rows.length
        ? <div className="empty-state"><strong>No hay recorridos finalizados para esta consulta.</strong>
          <p>Revisa los filtros o consulta de nuevo cuando se complete un recorrido.</p></div>
        : <DataTable rows={rows} columns={columns} loading={source.loading}
          actions={row => <Button variant="quiet" aria-expanded={selectedDetail === row.id}
            aria-controls={`payment-detail-${String(row.id)}`}
            aria-label={`${selectedDetail === row.id ? "Cerrar" : "Ver"} detalle del recorrido ${String(row.reference)}`}
            onClick={() => setSelectedDetail(current => current === row.id ? null : String(row.id))}>
            {selectedDetail === row.id ? "Cerrar detalle" : "Ver detalle"}
          </Button>}
          renderExpandedRow={row => selectedDetail === row.id ?
          <div className="payment-station-detail" id={`payment-detail-${String(row.id)}`}><h4>Estaciones · {String(row.reference)}</h4>
            <DataTable rows={(row as PaymentSimulationRow).stations} columns={stationColumns} showSearch={false} />
          </div> : null} />}
    </article>}
  </ReportView>;
}

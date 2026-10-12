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
  { key: "tariff", label: "Tarifa", render: row => row.tariff == null ? "—" : paymentCurrency(String(row.tariff)) },
  { key: "referenceTotal", label: "Recaudación estimada", render: row => paymentCurrency(row.referenceTotal as string | null) },
];
const formatNumber = (value: unknown) => typeof value === "string" ? value : Number(value).toLocaleString("es-GT");

export function PaymentSimulationReport() {
  const source = useTripAccessSummary();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [filterError, setFilterError] = useState("");
  const lookups = useMemo(() => paymentSimulationLookups(source.trips), [source.trips]);
  const rows = useMemo(() => paymentSimulationRows(source.trips, appliedFilters), [source.trips, appliedFilters]);
  const totals = paymentSimulationTotals(rows);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (filters.from && filters.to && filters.from > filters.to) {
      setFilterError("La fecha inicial debe ser anterior a la final."); return;
    }
    setFilterError(""); setAppliedFilters({ ...filters });
  }

  return <div className="payment-simulation-report">
    <article className="panel">
      <span className="section-kicker">RECAUDACIÓN</span>
      <div className="panel-heading"><div><h2>Recaudación por recorrido</h2>
        <p>Consulta los accesos registrados en las estaciones y la recaudación estimada generada durante cada recorrido.</p></div></div>
      <p className="muted">Los accesos corresponden a personas registradas dentro del área de espera después del molinete.</p>
      <p className="muted">Los valores se utilizan para control interno y no representan transacciones procesadas por una entidad financiera.</p>
      <p className="muted">Se utiliza el medio principal y la tarifa configurados actualmente en cada estación. Las fechas corresponden al inicio del recorrido, en hora de Guatemala.</p>
    </article>
    <Notice error={source.error || filterError} />
    <ReportFilters kind="payment-simulation" filters={filters} lookups={lookups} busy={source.loading || Boolean(source.error)}
      onChange={(name, value) => setFilters(current => ({ ...current, [name]: value }))} onSubmit={apply} />
    {!source.error && <ReportSummary statistics={[
      { title: "Recorridos consultados", value: source.loading ? "…" : totals.trips },
      { title: "Accesos estimados", value: source.loading ? "…" : totals.accesses },
      { title: "Recaudación estimada", value: source.loading ? "…" : paymentCurrency(totals.referenceTotal) },
    ]} formatNumber={formatNumber} />}
    {!source.loading && !source.error && totals.missingPayments > 0 && <div className="notice notice-warning">
      {totals.missingPayments} visitas tienen configuración de pago incompleta. Sus accesos se incluyen y su recaudación queda sin calcular. Los importes disponibles son parciales.
    </div>}
    {!source.error && <article className="panel">
      <div className="panel-heading"><div><h2>Resumen por recorrido</h2>
        <p>Datos generados por la operación. Consulta el detalle de las estaciones de cada recorrido.</p></div>
        <Button variant="secondary" disabled={source.loading || !rows.length} onClick={() => downloadCsv("transmetro-recaudacion-recorridos.csv",
          revenueCsvHeaders, revenueCsvRows(rows))}>
          ↓ Exportar CSV
        </Button></div>
      {!source.loading && !rows.length
        ? <div className="empty-state"><strong>No hay recorridos finalizados para esta consulta.</strong>
          <p>Revisa los filtros o consulta de nuevo cuando se complete un recorrido.</p></div>
        : <DataTable rows={rows} columns={columns} loading={source.loading} renderExpandedRow={row =>
          <div className="payment-station-detail"><h3>Detalle por estación · {String(row.reference)}</h3>
            <DataTable rows={(row as PaymentSimulationRow).stations} columns={stationColumns} showSearch={false} />
          </div>} />}
    </article>}
  </div>;
}

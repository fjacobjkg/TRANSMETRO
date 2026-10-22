import { getReportColumns } from "./reportColumns";
import { useState } from "react";
import "../../styles/reports.css";
import { Button } from "../ui/Button";
import { DataTable, textValue } from "../ui/DataTable";
import { Notice, PageHeader } from "../ui/PageHeader";
import { LineVisualization } from "../LineVisualization";
import { downloadCsv } from "../../utils/csv";
import { ReportFilters } from "./ReportFilters";
import { ReportSummary } from "./ReportSummary";
import { ReportTabs } from "./ReportTabs";
import { useReportsWorkspace } from "../../hooks/reports/useReportsWorkspace";
import { PaymentSimulationReport } from "./PaymentSimulationReport";
import { ReportView } from "./ReportView";
import { operationAlertCounts } from "../../utils/report-alerts";

export function ReportsWorkspace({ showNetwork = true, paymentSimulation = false }: {
  showNetwork?: boolean; paymentSimulation?: boolean;
}) {
  const report = useReportsWorkspace();
  const [showPayments, setShowPayments] = useState(false);
  const columns = getReportColumns(report.kind, paymentSimulation);
  const exportColumns = getReportColumns(report.kind);
  const alerts = operationAlertCounts(report.summary);
  const statistics = paymentSimulation && report.kind === "operations" ? [
    { title: "Visitas registradas", value: report.summary.visits },
    { title: "Demanda acumulada", value: report.summary.demandTotal },
    { title: "Alertas detectadas", value: alerts.total,
      note: report.busy ? undefined : `${report.formatNumber(alerts.unitAlerts)} por unidad adicional · ${report.formatNumber(alerts.waitAlerts)} por espera adicional` },
  ] : paymentSimulation && report.kind === "fleet" ? [
    { title: "Buses consultados", value: ((report.result.items ?? []) as unknown[]).length },
    { title: "Asignaciones encontradas", value: report.rows.length },
  ] : report.statistics;
  const actions = !showPayments && report.kind !== "network" && <Button variant="secondary" disabled={report.busy || !report.rows.length}
    onClick={() => downloadCsv("transmetro-" + report.kind + ".csv",
      exportColumns.map((column) => column.label),
      report.rows.map((row) => exportColumns.map((column) => textValue(row[column.key]))))}>
    ↓ Exportar CSV
  </Button>;

  return <section className="feature-page reports-page">
    <PageHeader eyebrow="INFORMACIÓN PARA DECIDIR" title="Consultas y reportes"
      description={paymentSimulation
        ? "Consulta el historial, revisa resultados y exporta información."
        : "Filtra la información operativa y exporta los resultados que estás consultando."}
      actions={paymentSimulation ? undefined : actions} />
    <ReportTabs selected={showPayments ? "payment-simulation" : report.kind}
      onSelect={kind => {
        setShowPayments(kind === "payment-simulation");
        if (kind !== "payment-simulation") report.setKind(kind);
      }} showNetwork={showNetwork} paymentSimulation={paymentSimulation} />
    {!showPayments && <Notice error={report.error} />}
    {showPayments ? <PaymentSimulationReport /> : report.kind === "network"
      ? <article className="panel"><LineVisualization /></article>
      : <ReportView enabled={paymentSimulation}
        title={report.kind === "operations" ? (paymentSimulation ? "Operación registrada" : "Visitas y demanda")
          : report.kind === "fleet" ? (paymentSimulation ? "Asignaciones de flota" : "Historial de flota") : "Conteos por medio"}
        description={report.kind === "operations" ? "Consulta las visitas registradas, la demanda y sus alertas."
          : report.kind === "fleet" ? "Consulta el historial de asignaciones de buses a línea, parqueo y piloto."
          : "Consulta los accesos registrados por estación y medio."}
        filters={<ReportFilters kind={report.kind} filters={report.filters} lookups={report.lookups} busy={report.busy}
          onChange={(name, value) => report.setFilters((current) => ({ ...current, [name]: value }))}
          onSubmit={report.apply} />}
        metrics={<ReportSummary statistics={statistics.map(statistic => ({ ...statistic,
          value: paymentSimulation && report.busy ? "…" : statistic.value }))}
          formatNumber={value => value === "…" ? "…" : report.formatNumber(value)} />}>
        {report.kind === "operations" && Number(report.summary.estimatedVisits) > 0 &&
          <div className="notice notice-warning">{paymentSimulation
            ? `${report.formatNumber(report.summary.estimatedVisits)} visitas usan la capacidad actual del bus porque no tienen capacidad histórica registrada.`
            : `${report.formatNumber(report.summary.estimatedVisits)} visitas del origen no tienen capacidad histórica registrada. Sus recomendaciones se estiman con la capacidad actual del bus.`}</div>}
        {Boolean(report.result.truncated) &&
          <div className="notice notice-warning">Los totales incluyen todos los registros coincidentes. La tabla y el CSV contienen las primeras {String(report.result.detailLimit)} visitas. Acota las fechas para exportar el detalle completo.</div>}
        <article className="panel report-results">
          {paymentSimulation && <div className="panel-heading"><h3>Resultados de la consulta</h3>{actions}</div>}
          <DataTable resetKey={JSON.stringify([report.kind, report.filters])} rows={report.rows} columns={columns} loading={report.busy} />
          {report.kind === "fleet" && <p className="muted report-caption">{paymentSimulation
            ? "Hasta 100 asignaciones de cada tipo por bus."
            : "Últimas 100 asignaciones de cada tipo por bus. Los filtros de línea y bus delimitan las unidades consultadas."}</p>}
        </article>
      </ReportView>}
  </section>;
}

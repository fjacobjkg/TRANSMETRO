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

export function ReportsWorkspace({ showNetwork = true, paymentSimulation = false }: {
  showNetwork?: boolean; paymentSimulation?: boolean;
}) {
  const report = useReportsWorkspace();
  const [showPayments, setShowPayments] = useState(false);
  const columns = getReportColumns(report.kind);
  const actions = !showPayments && report.kind !== "network" && <Button variant="secondary" disabled={report.busy || !report.rows.length}
    onClick={() => downloadCsv("transmetro-" + report.kind + ".csv",
      columns.map((column) => column.label),
      report.rows.map((row) => columns.map((column) => textValue(row[column.key]))))}>
    ↓ Exportar CSV
  </Button>;

  return <section className="feature-page reports-page">
    <PageHeader eyebrow="INFORMACIÓN PARA DECIDIR" title="Consultas y reportes"
      description={paymentSimulation
        ? "Filtra la información operativa y consulta los resultados generados por la operación."
        : "Filtra la información operativa y exporta los resultados que estás consultando."}
      actions={actions} />
    <ReportTabs selected={showPayments ? "payment-simulation" : report.kind}
      onSelect={kind => {
        setShowPayments(kind === "payment-simulation");
        if (kind !== "payment-simulation") report.setKind(kind);
      }} showNetwork={showNetwork} paymentSimulation={paymentSimulation} />
    {!showPayments && <Notice error={report.error} />}
    {showPayments ? <PaymentSimulationReport /> : report.kind === "network"
      ? <article className="panel"><LineVisualization /></article>
      : <>
        <ReportFilters kind={report.kind} filters={report.filters} lookups={report.lookups} busy={report.busy}
          onChange={(name, value) => report.setFilters((current) => ({ ...current, [name]: value }))}
          onSubmit={report.apply} />
        <ReportSummary statistics={report.statistics} formatNumber={report.formatNumber} />
        {report.kind === "operations" && Number(report.summary.estimatedVisits) > 0 &&
          <div className="notice notice-warning">{report.formatNumber(report.summary.estimatedVisits)} visitas del origen no tienen capacidad histórica registrada. Sus recomendaciones se estiman con la capacidad actual del bus.</div>}
        {Boolean(report.result.truncated) &&
          <div className="notice notice-warning">Los totales incluyen todos los registros coincidentes. La tabla y el CSV contienen las primeras {String(report.result.detailLimit)} visitas. Acota las fechas para exportar el detalle completo.</div>}
        <article className="panel"><DataTable rows={report.rows} columns={columns} loading={report.busy} />
          {report.kind === "fleet" && <p className="muted">Últimas 100 asignaciones de cada tipo por bus. Los filtros de línea y bus delimitan las unidades consultadas.</p>}
        </article>
      </>}
  </section>;
}

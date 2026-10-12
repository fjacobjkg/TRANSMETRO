import { paymentCurrency as currency } from "../../utils/payment-simulation-report";
import { useTripAccessSummary } from "../../hooks/operations/useTripAccessSummary";
import { tripAccessSummary } from "../../utils/trip-access-summary";
import { DataTable, type Column } from "../ui/DataTable";
import { Notice } from "../ui/PageHeader";
import { Select } from "../ui/Select";
import { OperationCard } from "./OperationCard";

export function TripAccessSummary() {
  const workspace = useTripAccessSummary();
  const summary = workspace.trip ? tripAccessSummary(workspace.trip) : null;
  const columns: Column[] = [
    { key: "name", label: "Estación" },
    { key: "accesses", label: "Accesos estimados" },
    { key: "medium", label: "Medio de pago", render: row => String(row.medium ?? row.configurationIssue ?? "Sin medio de pago principal") },
    { key: "tariff", label: "Tarifa", render: row => row.tariff == null ? "—" : currency(String(row.tariff)) },
    { key: "referenceTotal", label: "Recaudación estimada", render: row => currency(row.referenceTotal as string | null) },
  ];
  return (
    <OperationCard eyebrow="RESUMEN POR RECORRIDO" title="Resumen de recorridos" icon="▤" className="trip-access-summary-card">
      <div className="work-form">
        <p className="field-help">Consulta los accesos estimados después del molinete y su recaudación según el medio principal y la tarifa actual de cada estación.</p>
        <Notice error={workspace.error} />
        <div className="access-summary-controls">
        <label>
          Selecciona un recorrido
          <Select value={workspace.selectedTrip} disabled={workspace.loading}
            onChange={event => workspace.setSelectedTrip(event.target.value)} placeholder="Selecciona un recorrido">
            {workspace.trips.map(trip => <option key={trip.id_recorrido} value={trip.id_recorrido}>
              {trip.linea.nombre} · {trip.bus.codigo} · {new Date(trip.fecha_inicio).toLocaleString("es-GT")} · #{trip.id_recorrido}
            </option>)}
          </Select>
        </label>
        </div>
        {workspace.loading ? <p role="status" className="field-help">Cargando recorridos finalizados...</p>
          : workspace.error ? null : !summary ? <div className="empty-state"><strong>No hay recorridos finalizados para consultar.</strong><p>El resumen estará disponible cuando se complete un recorrido.</p></div>
          : <>
            <div className="visit-summary-box">
              <span className="section-kicker">RESUMEN INFORMATIVO</span>
              <div className="visit-summary-metrics">
                <div><strong>{summary.accesses}</strong><span>Accesos estimados</span></div>
                <div><strong>{summary.stationsServed}</strong><span>Estaciones atendidas</span></div>
                <div><strong>{currency(summary.referenceTotal)}</strong><span>Recaudación estimada</span></div>
              </div>
              <p className="field-help">{summary.medium}</p>
              {summary.missingPayments > 0 && <p className="notice notice-warning">{summary.missingPayments} estaciones sin configuración principal válida. La recaudación disponible es parcial.</p>}
            </div>
            <span className="section-kicker">DETALLE POR ESTACIÓN</span>
            <DataTable rows={summary.stations.map(station => ({ ...station, id: station.visitId }))}
              columns={columns} showSearch={summary.stations.length > 5} />
            <div className="visit-summary-box">
              <span className="section-kicker">RESUMEN DEL RECORRIDO</span>
              <div className="access-summary-total">
                <div><strong>{summary.medium}</strong><span>{summary.accesses} accesos estimados</span></div>
                <div><span>Recaudación estimada</span><strong>{currency(summary.referenceTotal)}</strong></div>
              </div>
            </div>
          </>}
      </div>
    </OperationCard>
  );
}

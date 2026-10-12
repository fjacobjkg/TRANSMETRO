import { ACCESS_REFERENCE_MEDIUM, ACCESS_REFERENCE_VALUE } from "../../config/access-reference";
import { useTripAccessSummary } from "../../hooks/operations/useTripAccessSummary";
import { tripAccessSummary } from "../../utils/trip-access-summary";
import { Button } from "../ui/Button";
import { DataTable, type Column } from "../ui/DataTable";
import { Notice } from "../ui/PageHeader";
import { Select } from "../ui/Select";
import { OperationCard } from "./OperationCard";

const currency = (value: number) => `Q${value.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function TripAccessSummary() {
  const workspace = useTripAccessSummary();
  const summary = workspace.trip ? tripAccessSummary(workspace.trip, ACCESS_REFERENCE_VALUE) : null;
  const columns: Column[] = [
    { key: "name", label: "Estación" },
    { key: "accesses", label: "Accesos estimados" },
    { key: "medium", label: "Medio de acceso" },
    { key: "referenceTotal", label: "Total referencial", render: row => currency(Number(row.referenceTotal)) },
  ];
  return (
    <OperationCard eyebrow="RESUMEN POR RECORRIDO" title="Resumen de recorridos" icon="▤" className="trip-access-summary-card">
      <div className="work-form">
        <p className="field-help">Resumen informativo de accesos y recaudación estimada. Se asume que las personas esperando ya pasaron por el molinete. Este resumen no modifica los conteos diarios por medio de acceso.</p>
        <Notice error={workspace.error} />
        <label>
          Recorrido finalizado
          <Select value={workspace.selectedTrip} disabled={workspace.loading}
            onChange={event => workspace.setSelectedTrip(event.target.value)} placeholder="Selecciona un recorrido finalizado">
            {workspace.trips.map(trip => <option key={trip.id_recorrido} value={trip.id_recorrido}>
              {trip.linea.codigo} · bus {trip.bus.codigo} · {new Date(trip.fecha_inicio).toLocaleString("es-GT")} · #{trip.id_recorrido}
            </option>)}
          </Select>
        </label>
        <Button variant="secondary" disabled={workspace.loading} onClick={workspace.refresh}>Actualizar resumen</Button>
        {workspace.loading ? <p role="status" className="field-help">Cargando recorridos finalizados...</p>
          : workspace.error ? null : !summary ? <div className="empty-state"><strong>No hay recorridos finalizados para consultar.</strong><p>El resumen estará disponible cuando se complete un recorrido.</p></div>
          : <>
            <div className="visit-summary-box">
              <span className="section-kicker">RESUMEN INFORMATIVO</span>
              <div className="visit-summary-metrics">
                <div><span>Accesos estimados</span><strong>{summary.accesses}</strong></div>
                <div><span>Estaciones atendidas</span><strong>{summary.stationsServed}</strong></div>
                <div><span>Total referencial</span><strong>{currency(summary.referenceTotal)}</strong></div>
              </div>
              <p className="field-help">Medio de acceso: {ACCESS_REFERENCE_MEDIUM}. Valor referencial: {currency(ACCESS_REFERENCE_VALUE)} por acceso.</p>
            </div>
            <span className="section-kicker">DETALLE</span>
            <DataTable rows={summary.stations.map(station => ({ ...station, id: station.visitId, medium: ACCESS_REFERENCE_MEDIUM }))}
              columns={columns} />
            <div className="visit-summary-box">
              <span className="section-kicker">TOTAL</span>
              <strong>{ACCESS_REFERENCE_MEDIUM} · {summary.accesses} accesos estimados</strong>
              <strong>Total referencial: {currency(summary.referenceTotal)}</strong>
              <p className="field-help">Valor informativo para control interno; no representa pagos ni transacciones financieras.</p>
            </div>
          </>}
      </div>
    </OperationCard>
  );
}

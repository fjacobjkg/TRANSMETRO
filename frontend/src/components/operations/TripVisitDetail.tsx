import type { Trip, Visit } from "../../types/operations.types";
import { orderedVisits } from "../../utils/visit-passengers";
import { Button } from "../ui/Button";
import "../../styles/components/trip-visit-detail.css";

export function TripVisitAlerts({ visit, showNormal = true }: { visit?: Visit; showNormal?: boolean }) {
  if (!visit) return <span>—</span>;
  if (!showNormal && !visit.alerta_unidad_adicional && visit.espera_adicional_minutos <= 0) return null;
  return <div className="trip-visit-badges">
    {visit.alerta_unidad_adicional && <span className="badge badge-warn">Unidad adicional requerida</span>}
    {visit.espera_adicional_minutos > 0 && <span className="badge badge-blue">+{visit.espera_adicional_minutos} min de espera</span>}
    {showNormal && !visit.alerta_unidad_adicional && visit.espera_adicional_minutos === 0 && <span className="badge badge-good">Operación normal</span>}
  </div>;
}

export function TripVisitToggle({ trip, expanded, onToggle }: { trip: Trip; expanded: boolean; onToggle: () => void }) {
  const label = expanded ? "Ocultar detalle" : "Ver detalle";
  const count = `${trip.visitas.length} ${trip.visitas.length === 1 ? "visita" : "visitas"}`;
  return <Button variant="quiet" className="trip-detail-toggle" aria-expanded={expanded}
    aria-controls={`trip-detail-${trip.id_recorrido}`} aria-label={`${count} · ${label} del recorrido ${trip.id_recorrido}`}
    onClick={onToggle}>
    <span aria-hidden="true">{expanded ? "▼" : "▶"}</span>
    <span>{count} · {label}</span>
  </Button>;
}

export function TripVisitDetail({ trip }: { trip: Trip }) {
  const visits = orderedVisits(trip.visitas);
  return <section className="trip-detail" id={`trip-detail-${trip.id_recorrido}`} aria-label={`Detalle del recorrido ${trip.id_recorrido}`}>
    {visits.length === 0 ? <p className="field-help">Este recorrido todavía no tiene visitas registradas.</p> :
      <ol className="visit-timeline">
        {visits.map(visit => <li className="trip-visit-item" key={visit.id_visita}>
          <strong className="trip-visit-station">{visit.orden}. {visit.estacion.nombre}</strong>
          <p className="trip-visit-summary">A bordo <strong>{visit.ocupacion}</strong> · En espera <strong>{visit.demanda}</strong></p>
          <TripVisitAlerts visit={visit} showNormal={false} />
        </li>)}
      </ol>}
  </section>;
}

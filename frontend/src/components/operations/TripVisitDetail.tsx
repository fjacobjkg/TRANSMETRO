import type { Trip, Visit } from "../../types/operations.types";
import { hasPassengerMovements, orderedVisits } from "../../utils/visit-passengers";
import "../../styles/components/trip-visit-detail.css";

export function TripVisitAlerts({ visit }: { visit?: Visit }) {
  if (!visit) return <span>—</span>;
  return <div className="trip-visit-badges">
    {visit.alerta_unidad_adicional && <span className="badge badge-warn">Unidad adicional requerida</span>}
    {visit.espera_adicional_minutos > 0 && <span className="badge badge-blue">+{visit.espera_adicional_minutos} min de espera</span>}
    {!visit.alerta_unidad_adicional && visit.espera_adicional_minutos === 0 && <span className="badge badge-good">Operación normal</span>}
  </div>;
}

export function TripVisitDetail({ trip }: { trip: Trip }) {
  const visits = orderedVisits(trip.visitas);
  return <section className="trip-detail" id={`trip-detail-${trip.id_recorrido}`} aria-label={`Detalle del recorrido ${trip.id_recorrido}`}>
    <span className="section-kicker">DETALLE DEL RECORRIDO</span>
    {visits.length === 0 ? <p className="field-help">Este recorrido todavía no tiene visitas registradas.</p> :
      <ol className="trip-visits-grid">
        {visits.map((visit, index) => <li className="trip-visit-card" key={visit.id_visita}>
          <h4>{visit.orden}. {visit.estacion.nombre}</h4>
          <dl className="trip-visit-values">
            {hasPassengerMovements(visit) ? <>
              <div><dt>A bordo al llegar</dt><dd>{visits[index - 1]?.ocupacion ?? 0}</dd></div>
              <div><dt>Bajaron</dt><dd>{visit.personas_bajan}</dd></div>
              <div><dt>Abordaron</dt><dd>{visit.personas_abordan}</dd></div>
              <div><dt>A bordo al salir</dt><dd>{visit.ocupacion}</dd></div>
            </> : <div><dt>Ocupación registrada</dt><dd>{visit.ocupacion}</dd></div>}
            <div><dt>En espera</dt><dd>{visit.demanda}</dd></div>
          </dl>
          <TripVisitAlerts visit={visit} />
          {visit.evaluationSource === "current_capacity" && <p className="field-help">Evaluación estimada con capacidad actual</p>}
        </li>)}
      </ol>}
  </section>;
}

import { useMemo, useState } from "react";
import { DataTable, type Column, type Row } from "../ui/DataTable";
import { OperationCard } from "./OperationCard";
import type { Trip } from "../../types/operations.types";
import { hasPassengerMovements, orderedVisits } from "../../utils/visit-passengers";

export function TripsTable({ trips, busy, onCancel }: { trips: Trip[]; busy: boolean; onCancel: (trip: Trip) => void }) {
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const columns: Column[] = [
    { key: "fecha", label: "Inicio", render: row => new Date(String(row.fecha)).toLocaleString("es-GT") },
    { key: "linea", label: "Línea" }, { key: "bus", label: "Bus" },
    { key: "estado", label: "Estado", render: row => <span className={`state-tag state-${String(row.estado).toLowerCase()}`}>{String(row.estado).replace("_", " ")}</span> },
    { key: "visitas", label: "Visitas", render: row => {
      const trip = row.trip as Trip;
      const id = String(trip.id_recorrido);
      return <div className="trip-detail-toggle">
        <span>{trip.visitas.length} visitas</span>
        <button className="button quiet" type="button" aria-expanded={expandedTrip === id}
          aria-controls={`trip-detail-${id}`} aria-label={`${expandedTrip === id ? "Ocultar" : "Ver"} detalle del recorrido ${id}`}
          onClick={() => setExpandedTrip(current => current === id ? null : id)}>
          {expandedTrip === id ? "Ocultar detalle" : "Ver detalle"}
        </button>
      </div>;
    } },
    { key: "acciones", label: "Acciones", render: row => {
      const trip = row.trip as Trip;
      return trip.estado === "EN_CURSO" ? <button className="button danger" type="button" disabled={busy} onClick={() => onCancel(trip)}>Cancelar</button> : null;
    } },
  ];
  const rows: Row[] = useMemo(() => trips.map(trip => ({
    id: trip.id_recorrido, fecha: trip.fecha_inicio, linea: `${trip.linea.codigo} · ${trip.linea.nombre}`,
    bus: trip.bus.codigo, estado: trip.estado, visitas: trip.visitas.length, trip,
  })), [trips]);
  return <OperationCard eyebrow="HISTORIAL OPERATIVO" title="Recorridos" icon="▤" className="trip-list-card"
    description="Consulta los recorridos realizados y revisa las estaciones atendidas durante cada operación.">
    <DataTable rows={rows} columns={columns} loading={busy} renderExpandedRow={row => {
      const trip = row.trip as Trip;
      if (expandedTrip !== String(trip.id_recorrido)) return null;
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
              <div className="trip-visit-badges">
                {visit.alerta_unidad_adicional && <span className="badge badge-warn">Unidad adicional requerida</span>}
                {visit.espera_adicional_minutos > 0 && <span className="badge badge-blue">+{visit.espera_adicional_minutos} min de espera</span>}
                {!visit.alerta_unidad_adicional && visit.espera_adicional_minutos === 0 && <span className="badge badge-good">Operación normal</span>}
              </div>
              {visit.evaluationSource === "current_capacity" && <p className="field-help">Evaluación estimada con capacidad actual</p>}
            </li>)}
          </ol>}
      </section>;
    }} />
  </OperationCard>;
}

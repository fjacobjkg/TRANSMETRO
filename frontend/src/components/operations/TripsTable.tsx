import { DataTable, type Column, type Row } from "../ui/DataTable";
import { OperationCard } from "./OperationCard";
import type { Trip } from "../../types/operations.types";
export function TripsTable({ trips, busy, onCancel }: { trips: Trip[]; busy: boolean; onCancel: (trip: Trip) => void }) {
  const columns: Column[] = [
    { key: "fecha", label: "Inicio", render: (row) => new Date(String(row.fecha)).toLocaleString("es-GT") },
    { key: "linea", label: "Línea" }, { key: "bus", label: "Bus" },
    { key: "estado", label: "Estado", render: (row) => <span className={`state-tag state-${String(row.estado).toLowerCase()}`}>{String(row.estado).replace("_", " ")}</span> },
    { key: "visitas", label: "Visitas y evaluación", render: (row) => {
      const trip = row.trip as Trip;
      return <details><summary>{trip.visitas.length} visitas · Ver detalle</summary><ol className="visit-timeline">
        {trip.visitas.map((visit) => <li key={visit.id_visita}><strong>{visit.orden}. {visit.estacion.nombre}</strong>
          <span>Ocupación {visit.ocupacion} · demanda {visit.demanda}</span>
          {visit.evaluationSource === "current_capacity" && <span className="muted">Evaluación estimada con capacidad actual</span>}
          {visit.alerta_unidad_adicional && <span className="badge badge-warn">Unidad adicional requerida</span>}
          {visit.espera_adicional_minutos > 0 && <span className="badge badge-blue">+{visit.espera_adicional_minutos} min de espera</span>}
        </li>)}</ol></details>;
    } },
    { key: "acciones", label: "Acciones", render: (row) => {
      const trip = row.trip as Trip;
      return trip.estado === "EN_CURSO" ? <button className="button danger" type="button" disabled={busy} onClick={() => onCancel(trip)}>Cancelar</button> : null;
    } },
  ];
  const rows: Row[] = trips.map((trip) => ({
    id: trip.id_recorrido, fecha: trip.fecha_inicio, linea: `${trip.linea.codigo} · ${trip.linea.nombre}`,
    bus: trip.bus.codigo, estado: trip.estado, visitas: trip.visitas.length, trip,
  }));
  return <OperationCard eyebrow="REGISTROS RECIENTES" title="Recorridos" icon="▤" className="trip-list-card">
    <DataTable rows={rows} columns={columns} loading={busy} />
  </OperationCard>;
}

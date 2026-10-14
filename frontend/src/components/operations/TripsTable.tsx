import { useMemo, useState } from "react";
import { DataTable, type Column, type Row } from "../ui/DataTable";
import { OperationCard } from "./OperationCard";
import type { Trip } from "../../types/operations.types";
import { TripVisitDetail, TripVisitToggle } from "./TripVisitDetail";

export function TripsTable({ trips, busy, onCancel }: { trips: Trip[]; busy: boolean; onCancel: (trip: Trip) => void }) {
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const columns: Column[] = [
    { key: "fecha", label: "Inicio", render: row => new Date(String(row.fecha)).toLocaleString("es-GT") },
    { key: "linea", label: "Línea" }, { key: "bus", label: "Bus" },
    { key: "estado", label: "Estado", render: row => <span className={`state-tag state-${String(row.estado).toLowerCase()}`}>{String(row.estado).replace("_", " ")}</span> },
    { key: "visitas", label: "Visitas", render: row => {
      const trip = row.trip as Trip;
      const id = String(trip.id_recorrido);
      return <TripVisitToggle trip={trip} expanded={expandedTrip === id}
        onToggle={() => setExpandedTrip(current => current === id ? null : id)} />;
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
      return <TripVisitDetail trip={trip} />;
    }} />
  </OperationCard>;
}

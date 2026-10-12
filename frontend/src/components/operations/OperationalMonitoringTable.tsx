import { useMemo, useState } from "react";
import type { Line, Trip, Visit } from "../../types/operations.types";
import { monitoringSnapshot } from "../../utils/operational-monitoring";
import { DataTable, type Column, type Row } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { OperationCard } from "./OperationCard";
import { TripVisitAlerts, TripVisitDetail } from "./TripVisitDetail";

export function OperationalMonitoringTable({ trips, lines, loading, active }: {
  trips: Trip[]; lines: Line[]; loading: boolean; active: boolean;
}) {
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const rows: Row[] = useMemo(() => trips.map(trip => ({
    id: trip.id_recorrido, trip, fecha: trip.fecha_inicio, linea: `${trip.linea.codigo} · ${trip.linea.nombre}`,
    bus: trip.bus.codigo, estado: trip.estado,
    ...monitoringSnapshot(trip, lines),
  })), [trips, lines]);
  const columns: Column[] = [
    { key: "fecha", label: "Inicio", render: row => new Date(String(row.fecha)).toLocaleString("es-GT") },
    { key: "linea", label: "Línea" }, { key: "bus", label: "Bus" },
    ...(active ? [
      { key: "nextStation", label: "Próxima estación" },
      { key: "lastStation", label: "Última estación" },
      { key: "occupancy", label: "A bordo" }, { key: "waiting", label: "En espera" },
    ] : []),
    { key: "visits", label: "Estaciones atendidas" },
    { key: "lastVisit", label: active ? "Alertas actuales" : "Última evaluación",
      render: row => <TripVisitAlerts visit={row.lastVisit as Visit | undefined} /> },
    { key: "estado", label: "Estado", render: row => <span className={`state-tag state-${String(row.estado).toLowerCase()}`}>{String(row.estado).replace("_", " ")}</span> },
  ];
  return <OperationCard eyebrow={active ? "EN CURSO" : "HISTORIAL"} title={active ? "Recorridos en curso" : "Historial de recorridos"}
    icon="▤" className="trip-list-card">
    <DataTable rows={rows} columns={columns} loading={loading} actions={row => {
      const id = String(row.id);
      return <Button variant="quiet" aria-expanded={expandedTrip === id} aria-controls={`trip-detail-${id}`}
        aria-label={`${expandedTrip === id ? "Ocultar" : "Ver"} detalle del recorrido ${id}`}
        onClick={() => setExpandedTrip(current => current === id ? null : id)}>
        {expandedTrip === id ? "Ocultar detalle" : "Ver detalle"}
      </Button>;
    }} renderExpandedRow={row => expandedTrip === String(row.id) ? <TripVisitDetail trip={row.trip as Trip} /> : null} />
  </OperationCard>;
}

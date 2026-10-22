import { useMemo, useState } from "react";
import type { Line, Trip, Visit } from "../../types/operations.types";
import { monitoringSnapshot } from "../../utils/operational-monitoring";
import { DataTable, type Column, type Row } from "../ui/DataTable";
import { OperationCard } from "./OperationCard";
import { TripVisitAlerts, TripVisitDetail, TripVisitToggle } from "./TripVisitDetail";

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
    <DataTable resetKey={active ? "active" : "history"} rows={rows} columns={columns} loading={loading} actions={row => {
      const id = String(row.id);
      return <TripVisitToggle trip={row.trip as Trip} expanded={expandedTrip === id}
        onToggle={() => setExpandedTrip(current => current === id ? null : id)} />;
    }} renderExpandedRow={row => expandedTrip === String(row.id) ? <TripVisitDetail trip={row.trip as Trip} /> : null} />
  </OperationCard>;
}

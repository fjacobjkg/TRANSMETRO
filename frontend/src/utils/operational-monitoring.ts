import type { Line, Trip } from "../types/operations.types";

export function monitoringSnapshot(trip: Trip, lines: Line[]) {
  const lastVisit = [...trip.visitas].sort((a, b) => a.orden - b.orden).at(-1);
  // Same station interpretation as the operator: ordered stops indexed by visit count.
  const stations = lines.find(line => line.codigo === trip.linea.codigo)?.estaciones ?? trip.linea.estaciones;
  const nextStation = stations ? [...stations].sort((a, b) => a.orden - b.orden)[trip.visitas.length] : undefined;
  return {
    lastVisit,
    nextStation: stations ? nextStation?.estacion.nombre ?? "Recorrido listo para finalizar" : "No disponible",
    lastStation: lastVisit?.estacion.nombre ?? "Sin visitas registradas",
    visits: stations ? `${trip.visitas.length} de ${stations.length}` : `${trip.visitas.length} visitas`,
    occupancy: lastVisit?.ocupacion ?? null,
    waiting: lastVisit?.demanda ?? null,
  };
}

export function monitoringTrips(trips: Trip[], section: string) {
  return trips.filter(trip => section === "active" ? trip.estado === "EN_CURSO"
    : trip.estado === "FINALIZADO" || trip.estado === "CANCELADO");
}

export function monitoringSummary(trips: Trip[]) {
  return {
    active: trips.filter(trip => trip.estado === "EN_CURSO").length,
    finalized: trips.filter(trip => trip.estado === "FINALIZADO").length,
    visits: trips.reduce((total, trip) => total + trip.visitas.length, 0),
    alerts: trips.reduce((total, trip) => total + trip.visitas.filter(visit =>
      visit.alerta_unidad_adicional || visit.espera_adicional_minutos > 0).length, 0),
  };
}

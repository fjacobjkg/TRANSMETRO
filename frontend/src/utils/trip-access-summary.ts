import type { Trip } from "../types/operations.types";

export function tripAccessSummary(trip: Trip, referenceValue: number) {
  if (trip.estado !== "FINALIZADO") return null;
  const stations = [...trip.visitas].sort((a, b) => a.orden - b.orden).map(visit => ({
    visitId: visit.id_visita, name: visit.estacion.nombre, accesses: visit.demanda,
    referenceTotal: visit.demanda * referenceValue,
  }));
  const accesses = stations.reduce((sum, station) => sum + station.accesses, 0);
  return { stations, accesses, stationsServed: stations.length, referenceTotal: accesses * referenceValue };
}

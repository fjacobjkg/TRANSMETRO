import type { Bus, Line, Trip } from "../types/operations.types";

// Lines and their ready buses are scoped by the authenticated API, not by shared station names.
export function availableOperationBuses(lines: Line[], trips: Trip[]): Bus[] {
  const occupied = new Set(trips.filter(trip => trip.estado === "EN_CURSO").map(trip => trip.bus.id_bus));
  const buses = new Map<number, Bus>();
  for (const line of lines) {
    for (const { bus } of line.asignaciones_bus) {
      if (!occupied.has(bus.id_bus)) buses.set(bus.id_bus, bus);
    }
  }
  return [...buses.values()];
}

import type { Visit } from "../types/operations.types";

export function orderedVisits(visits: Visit[]) {
  return [...visits].sort((a, b) => a.orden - b.orden);
}

export function arrivingPeople(visits: Visit[]) {
  return orderedVisits(visits).at(-1)?.ocupacion ?? 0;
}

export function hasPassengerMovements(visit: Visit) {
  return visit.personas_bajan != null && visit.personas_abordan != null;
}

export function previewVisit(capacity: number, arriving: number, off: string, boarding: string, demand: string) {
  if (![off, boarding, demand].every(value => value.trim() !== "")) return { ready: false, error: "" } as const;
  const peopleOff = Number(off), peopleBoarding = Number(boarding), waiting = Number(demand);
  let error = "";
  if (![arriving, peopleOff, peopleBoarding, waiting].every(value => Number.isSafeInteger(value) && value >= 0 && value <= 4_294_967_295)) {
    error = "Las cantidades de personas deben ser enteros no negativos.";
  } else if (!Number.isInteger(capacity) || capacity < 1) {
    error = "No está disponible la capacidad del bus para evaluar la visita.";
  } else if (peopleOff > arriving) {
    error = "No pueden bajar más personas de las que llegan en el bus.";
  } else if (peopleBoarding > waiting) {
    error = "No pueden abordar más personas de las que están esperando.";
  } else if (arriving - peopleOff + peopleBoarding > capacity) {
    error = "La ocupación resultante supera la capacidad máxima del bus.";
  }
  if (error) return { ready: false, error } as const;
  const occupancy = arriving - peopleOff + peopleBoarding;
  return { ready: true, error: "", peopleOff, peopleBoarding, waiting, occupancy,
    requiresSupportUnit: waiting * 2 >= capacity * 3,
    requiresExtraWait: occupancy * 4 < capacity } as const;
}

import type { Trip } from "../types/operations.types";

export function sumRevenue(values: Array<string | null>): string | null {
  const configured = values.filter((value): value is string => value !== null);
  if (!configured.length && values.length) return null;
  const cents = configured.reduce((sum, value) => {
    const [whole, fraction = ""] = value.split(".");
    return sum + BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  }, 0n);
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

export function tripAccessSummary(trip: Trip) {
  if (trip.estado !== "FINALIZADO") return null;
  const stations = [...trip.visitas].sort((a, b) => a.orden - b.orden).map(visit => ({
    visitId: visit.id_visita, name: visit.estacion.nombre, accesses: visit.demanda,
    medium: visit.revenue?.medium ?? null, tariff: visit.revenue?.tariff ?? null,
    referenceTotal: visit.revenue?.estimatedRevenue ?? null,
    configurationIssue: visit.revenue?.configurationIssue ?? (visit.revenue ? null : "Sin medio de pago principal"),
  }));
  const accesses = stations.reduce((sum, station) => sum + station.accesses, 0);
  const missingPayments = stations.filter(station => station.configurationIssue !== null).length;
  const media = [...new Set(stations.flatMap(station => station.medium ? [station.medium] : [station.configurationIssue ?? "Sin medio de pago principal"]))];
  return { stations, accesses, stationsServed: stations.length, missingPayments,
    medium: media.join(" · ") || "Sin estaciones atendidas", referenceTotal: sumRevenue(stations.map(station => station.referenceTotal)) };
}

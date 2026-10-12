import type { Trip } from "../types/operations.types";
import type { Row } from "../types/table.types";
import { tripAccessSummary, sumRevenue } from "./trip-access-summary";

// The existing trips endpoint includes the line ID alongside the operator's narrower Trip type.
type RecordedLine = Trip["linea"] & { id_linea: number };
const tripDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guatemala" });
export const paymentCurrency = (value: string | number | null) => {
  if (value === null) return "Sin calcular";
  const [whole, fraction = ""] = String(value).split(".");
  return `Q${BigInt(whole).toLocaleString("es-GT")}.${fraction.padEnd(2, "0")}`;
};

export interface PaymentSimulationRow extends Row {
  id: string;
  date: string;
  line: string;
  bus: string;
  reference: string;
  stationsServed: number;
  accesses: number;
  medium: string;
  referenceTotal: string | null;
  missingPayments: number;
  stations: NonNullable<ReturnType<typeof tripAccessSummary>>["stations"];
}

export function paymentSimulationRows(trips: Trip[], filters: Record<string, string> = {}): PaymentSimulationRow[] {
  return trips.flatMap(trip => {
    const summary = tripAccessSummary(trip);
    if (!summary) return [];
    const date = tripDate.format(new Date(trip.fecha_inicio));
    if ((filters.from && date < filters.from) || (filters.to && date > filters.to)
      || (filters.lineId && String((trip.linea as RecordedLine).id_linea) !== filters.lineId)
      || (filters.busId && String(trip.bus.id_bus) !== filters.busId)) return [];
    return [{ id: String(trip.id_recorrido), date: trip.fecha_inicio,
      line: `${trip.linea.codigo} · ${trip.linea.nombre}`, bus: trip.bus.codigo,
      reference: `#${trip.id_recorrido}`, ...summary }];
  });
}

export function paymentSimulationLookups(trips: Trip[]): Record<string, Row[]> {
  const lines = new Map<number, Row>();
  const buses = new Map<number, Row>();
  for (const trip of trips) {
    if (trip.estado !== "FINALIZADO") continue;
    const line = trip.linea as RecordedLine;
    lines.set(line.id_linea, { id_linea: line.id_linea, codigo: line.codigo, nombre: line.nombre });
    buses.set(trip.bus.id_bus, { id_bus: trip.bus.id_bus, codigo: trip.bus.codigo });
  }
  return { lineId: [...lines.values()], busId: [...buses.values()] };
}

export function paymentSimulationTotals(rows: PaymentSimulationRow[]) {
  return { trips: rows.length, accesses: rows.reduce((total, row) => total + row.accesses, 0),
    missingPayments: rows.reduce((total, row) => total + row.missingPayments, 0),
    referenceTotal: sumRevenue(rows.map(row => row.referenceTotal)) };
}

export const revenueCsvHeaders = ["Fecha", "Línea", "Bus", "Recorrido", "Estación", "Accesos estimados", "Medio de pago", "Tarifa (Q)", "Recaudación estimada (Q)", "Configuración"];
export function revenueCsvRows(rows: PaymentSimulationRow[]) {
  return rows.flatMap(row => row.stations.length ? row.stations.map(station => [
    new Date(row.date).toLocaleString("es-GT", { timeZone: "America/Guatemala" }), row.line, row.bus, row.reference,
    station.name, station.accesses, station.medium ?? "Sin medio de pago principal", station.tariff ?? "",
    station.referenceTotal ?? "", station.configurationIssue ?? "Configurada",
  ]) : [[new Date(row.date).toLocaleString("es-GT", { timeZone: "America/Guatemala" }), row.line, row.bus, row.reference,
    "Sin estaciones atendidas", 0, "", "", "0.00", "Sin visitas"]]);
}

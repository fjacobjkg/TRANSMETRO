import type { NetworkLine } from "../types/dashboard.types";
import type { Row } from "../types/table.types";

export interface CatalogLine extends Row {
  id_linea: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  municipalidad: { nombre: string };
  distanciaTotal: number | null;
  estaciones: Array<{
    estacion_id: number;
    orden: number;
    distancia_siguiente: number | string | null;
    estacion: { id_estacion: number; codigo: string; nombre: string };
  }>;
}

// Adapt the existing catalog response to the existing diagram; do not recalculate distances.
export function transportNetworkLines(lines: CatalogLine[]): NetworkLine[] {
  const stationLines = new Map<number, Set<number>>();
  for (const line of lines) for (const stop of line.estaciones) {
    const related = stationLines.get(stop.estacion_id) ?? new Set<number>();
    related.add(line.id_linea); stationLines.set(stop.estacion_id, related);
  }
  return lines.map(line => ({
    id: line.id_linea, code: line.codigo, name: line.nombre, municipality: line.municipalidad.nombre,
    totalDistance: line.distanciaTotal,
    stations: [...line.estaciones].sort((a, b) => a.orden - b.orden).map(stop => ({
      id: stop.estacion.id_estacion, code: stop.estacion.codigo, name: stop.estacion.nombre, order: stop.orden,
      distanceToNext: stop.distancia_siguiente === null ? null : Number(stop.distancia_siguiente),
      sharedLineIds: [...(stationLines.get(stop.estacion_id) ?? [])].filter(id => id !== line.id_linea),
    })),
  }));
}

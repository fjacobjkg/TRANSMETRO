import type { Prisma } from "../../../generated/prisma/client.js";
import type { AuthenticatedUser } from "../../middleware/auth.js";
import { ensure } from "../../lib/domain-error.js";

type OperatorScope = Pick<AuthenticatedUser, "role" | "stationIds">;
export const LINE_AUTHORIZATION_MESSAGE = "No tienes autorización para operar todas las estaciones de esta línea.";

// requireAuth reloads current, active station assignments from the DB on every request.
// Ignore historical line memberships; require at least one current stop and no uncovered stop.
export function operatorLineScope(user: OperatorScope): Prisma.lineaWhereInput {
  return user.role === "OPERADOR_ESTACION" ? { estaciones: {
    some: { activo: true },
    none: { activo: true, estacion_id: { notIn: user.stationIds } },
  } } : {};
}

export function canOperateLine(user: OperatorScope, stations: ReadonlyArray<{ estacion_id: number }>): boolean {
  if (user.role !== "OPERADOR_ESTACION") return true;
  const assigned = new Set(user.stationIds);
  return stations.length > 0 && stations.every(station => assigned.has(station.estacion_id));
}

export function assertOperableLine(user: OperatorScope, stations: ReadonlyArray<{ estacion_id: number }>) {
  ensure(user.role === "ADMIN" || user.role === "OPERADOR_ESTACION", 403, "No tienes permiso para realizar esta acción.");
  ensure(canOperateLine(user, stations), 403, LINE_AUTHORIZATION_MESSAGE);
}

// Apply the existing start-trip readiness rules when offering an operator a bus.
export function availableOperatorBusScope(): Prisma.busWhereInput {
  const current = { fecha_fin: null, fecha_inicio: { lte: new Date() } };
  return {
    activo: true,
    recorridos: { none: { estado: "EN_CURSO" } },
    asignaciones_piloto: { some: { ...current, piloto: { activo: true } } },
    asignaciones_parqueo: { some: { ...current, parqueo: { activo: true, estacion: { activo: true } } } },
  };
}

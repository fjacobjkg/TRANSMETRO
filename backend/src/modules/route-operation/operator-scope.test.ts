import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const m = vi.hoisted(() => ({ lines: vi.fn(), line: vi.fn(), trips: vi.fn(), total: vi.fn(), trip: vi.fn(),
  transaction: vi.fn(), lock: vi.fn(), bus: vi.fn(), assignment: vi.fn(), open: vi.fn(), parking: vi.fn(), pilot: vi.fn(),
  createTrip: vi.fn(), createVisit: vi.fn(), updateTrip: vi.fn(), visitCount: vi.fn(), audit: vi.fn(), auditRead: vi.fn(), payments: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: {
  linea: { findMany: m.lines }, recorrido: { findMany: m.trips, count: m.total },
  bitacora: { findMany: m.auditRead }, estacion_medio_acceso: { findMany: m.payments }, $transaction: m.transaction,
} }));
import { canOperateLine, operatorLineScope, LINE_AUTHORIZATION_MESSAGE } from "./operator-scope.js";
import { listOperationalLines, listTrips, startTrip, recordVisit, closeTrip } from "./route-operation.service.js";
import { routeOperationRouter } from "./route-operation.routes.js";
import { errorHandler } from "../../middleware/error-handler.js";
import type { AuthenticatedUser } from "../../middleware/auth.js";

const user6: AuthenticatedUser = { id: 6, name: "Operador Línea 6", username: "cualquier.nombre", role: "OPERADOR_ESTACION", stationIds: [5, 4, 6] };
const user18: AuthenticatedUser = { ...user6, id: 18, stationIds: [1, 2, 3, 4] };
const admin: AuthenticatedUser = { ...user6, id: 1, role: "ADMIN", stationIds: [] };
type Stop = { estacion_id: number; activo: boolean; orden: number; estacion: { id_estacion: number; nombre: string } };
type Line = { id_linea: number; codigo: string; nombre: string; activo: boolean; estaciones: Stop[] };
type Scope = { activo?: boolean; estaciones?: { some?: { activo: boolean }; none?: { activo: boolean; estacion_id: { notIn: number[] } } } };
type FixtureTrip = ReturnType<typeof makeTrip>;
let lines: Line[];
let trips: FixtureTrip[];
let unavailable: Set<number>;

const bus = (id: number) => ({ id_bus: id, codigo: `BUS-${String(id).padStart(3, "0")}`, activo: true, capacidad_maxima: 250 });
function makeTrip(id: number, lineId: number, state = "FINALIZADO", demands: number[] = []) {
  return { id_recorrido: BigInt(id), linea_id: lineId, bus_id: lineId === 6 ? 5 : 1, estado: state,
    fecha_inicio: new Date("2026-01-01T10:00:00Z"), bus: bus(lineId === 6 ? 5 : 1),
    visitas: demands.map((demanda, index) => ({ id_visita: BigInt(id * 10 + index), orden: index + 1,
      estacion_id: (lineId === 6 ? [5, 4, 6] : [1, 2, 3, 4])[index]!, ocupacion: 100, demanda,
      personas_bajan: 0, personas_abordan: 100, fecha_hora: new Date("2026-01-01T10:05:00Z") })),
  };
}
// A minimal query double evaluates the relation predicates sent to Prisma.
function matches(line: Line, where: Scope = {}) {
  if (where.activo !== undefined && line.activo !== where.activo) return false;
  if (where.estaciones?.some && !line.estaciones.some(stop => stop.activo)) return false;
  const excluded = where.estaciones?.none;
  return !excluded || !line.estaciones.some(stop => stop.activo && !excluded.estacion_id.notIn.includes(stop.estacion_id));
}
function matchingTrips(where: Record<string, any>) {
  return trips.filter(trip => (where.linea_id === undefined || trip.linea_id === where.linea_id) &&
    (where.bus_id === undefined || trip.bus_id === where.bus_id) &&
    (where.estado === undefined || trip.estado === where.estado) &&
    (!where.linea || matches(lines.find(line => line.id_linea === trip.linea_id)!, where.linea)) &&
    (!where.visitas || trip.visitas.some(visit => visit.estacion_id === where.visitas.some.estacion_id)));
}

beforeEach(() => {
  vi.resetAllMocks(); unavailable = new Set();
  const stations = new Map(["San Martín", "Victorias", "Portales", "San Rafael", "Zona 6 Norte", "Zona 6 Centro"]
    .map((nombre, index) => [index + 1, { id_estacion: index + 1, nombre }]));
  lines = [[18, [1, 2, 3, 4]], [6, [5, 4, 6]]].map(([id, ids]) => ({
    id_linea: id as number, codigo: `L${id}`, nombre: `Línea ${id}`, activo: true,
    estaciones: (ids as number[]).map((estacion_id, index) => ({ estacion_id, activo: true, orden: index + 1, estacion: stations.get(estacion_id)! })),
  }));
  trips = [makeTrip(61, 6, "FINALIZADO", [100, 140, 90]), makeTrip(181, 18, "FINALIZADO", [80, 375, 10, 0])];
  m.lines.mockImplementation(async ({ where, include }) => lines.filter(line => matches(line, where)).map(line => ({ ...line,
    asignaciones_bus: (line.id_linea === 6 ? [5, 6, 7] : [1, 2, 3, 4])
      .filter(id => !include.asignaciones_bus.where.bus || !unavailable.has(id)).map(id => ({ bus: bus(id) })),
  })));
  m.line.mockImplementation(async ({ where }) => lines.find(line => line.id_linea === where.id_linea) ?? null);
  m.trips.mockImplementation(async ({ where, skip, take }) => matchingTrips(where).slice(skip, skip + take)
    .map(trip => ({ ...trip, linea: lines.find(line => line.id_linea === trip.linea_id) })));
  m.total.mockImplementation(async ({ where }) => matchingTrips(where).length);
  m.trip.mockImplementation(async ({ where }) => {
    const trip = trips.find(trip => trip.id_recorrido === where.id_recorrido);
    return trip ? { ...trip, linea: lines.find(line => line.id_linea === trip.linea_id) } : null;
  });
  m.transaction.mockImplementation(async fn => fn({ $queryRaw: m.lock, linea: { findUnique: m.line }, bus: { findUnique: m.bus },
    asignacion_bus_linea: { findFirst: m.assignment }, asignacion_bus_parqueo: { findFirst: m.parking },
    asignacion_piloto_bus: { findFirst: m.pilot }, recorrido: { findFirst: m.open, findUnique: m.trip, create: m.createTrip, update: m.updateTrip },
    visita: { create: m.createVisit, count: m.visitCount }, bitacora: { create: m.audit },
  }));
  m.bus.mockImplementation(async ({ where }) => bus(where.id_bus));
  m.assignment.mockResolvedValue({ id_asignacion_bus_linea: 1 }); m.open.mockResolvedValue(null);
  m.parking.mockResolvedValue({ id_asignacion_bus_parqueo: 1 }); m.pilot.mockResolvedValue({ id_asignacion_piloto_bus: 1 });
  m.createTrip.mockImplementation(async ({ data }) => ({ id_recorrido: 999n, ...data }));
  m.createVisit.mockImplementation(async ({ data }) => ({ id_visita: 999n, ...data }));
  m.updateTrip.mockImplementation(async ({ data }) => data); m.auditRead.mockResolvedValue([]);
  m.payments.mockImplementation(async ({ where }) => where.estacion_id.in.map((estacion_id: number) => ({
    estacion_id, medio_acceso: { nombre: "Tarjeta Ciudadana", tarifa: "1.00" },
  })));
});

describe("Cobertura completa del operador sobre estaciones compartidas", () => {
  it("A: conserva San Rafael como una sola estación compartida y no modifica la red", async () => {
    const snapshot = structuredClone(lines);
    const l6 = (await listOperationalLines(user6)).items[0]!;
    const l18 = (await listOperationalLines(user18)).items[0]!;
    expect(l6.estaciones.find(stop => stop.estacion_id === 4)?.estacion)
      .toBe(l18.estaciones.find(stop => stop.estacion_id === 4)?.estacion);
    expect(lines).toEqual(snapshot);
  });
  it.each([[user6, 6], [user18, 18]] as const)("B/C: devuelve exclusivamente la línea cubierta para %j", async (user, id) => {
    const result = await listOperationalLines(user);
    expect(result.items.map(line => line.id_linea)).toEqual([id]);
    expect(m.lines).toHaveBeenCalledWith(expect.objectContaining({ where: { activo: true, estaciones: {
      some: { activo: true }, none: { activo: true, estacion_id: { notIn: user.stationIds } },
    } } }));
  });
  it("D: rechaza la petición HTTP manipulada con 403 antes de crear recorrido, bloquear bus o auditar", async () => {
    const layer = routeOperationRouter.stack.find(layer => layer.route?.path === "/trips" && layer.route.stack.some(entry => entry.method === "post"))!;
    const handler = layer.route!.stack.at(-1)!.handle;
    const response = { locals: { user: user6 }, status: vi.fn().mockReturnThis(), json: vi.fn() };
    const request = { body: { lineId: 18, busId: 1 } };
    await handler(request as Request, response as unknown as Response, (error: unknown) =>
      errorHandler(error, request as Request, response as unknown as Response, vi.fn()));
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: LINE_AUTHORIZATION_MESSAGE }));
    expect(m.createTrip).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled(); expect(m.lock).not.toHaveBeenCalled();
  });
  it("E: permite iniciar L6 con BUS-005", async () => {
    await startTrip(user6, 5, 6);
    expect(m.createTrip).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ linea_id: 6, bus_id: 5 }) }));
    expect(m.audit).toHaveBeenCalledTimes(1);
  });
  it("F: ofrece únicamente los tres buses de L6 y aplica disponibilidad global, piloto y parqueo", async () => {
    const result = await listOperationalLines(user6);
    expect(result.items.flatMap(line => line.asignaciones_bus.map(assignment => assignment.bus.codigo)))
      .toEqual(["BUS-005", "BUS-006", "BUS-007"]);
    expect(m.lines).toHaveBeenCalledWith(expect.objectContaining({ include: expect.objectContaining({
      asignaciones_bus: { where: { fecha_fin: null, fecha_inicio: { lte: expect.any(Date) }, bus: {
        activo: true, recorridos: { none: { estado: "EN_CURSO" } },
        asignaciones_piloto: { some: { fecha_fin: null, fecha_inicio: { lte: expect.any(Date) }, piloto: { activo: true } } },
        asignaciones_parqueo: { some: { fecha_fin: null, fecha_inicio: { lte: expect.any(Date) }, parqueo: { activo: true, estacion: { activo: true } } } },
      } }, include: { bus: true } },
    }) }));
    unavailable.add(5);
    expect((await listOperationalLines(user6)).items[0]!.asignaciones_bus.map(assignment => assignment.bus.id_bus)).toEqual([6, 7]);
  });
  it.each([user6, user18])("G: historial y total se limitan a las líneas cubiertas para %j", async user => {
    const result = await listTrips(user, { page: 1, pageSize: 100 });
    expect(result.total).toBe(1); expect(result.items.map(trip => trip.linea_id)).toEqual([user.id]);
    expect(m.total.mock.calls[0]![0].where).toEqual(m.trips.mock.calls[0]![0].where);
  });
  it("limita recorridos activos y rechaza filtros que intentan consultar L18 por ID o por San Rafael", async () => {
    trips.push(makeTrip(62, 6, "EN_CURSO"), makeTrip(182, 18, "EN_CURSO"));
    const result = await listTrips(user6, { state: "EN_CURSO", page: 1, pageSize: 100 });
    expect(result.items.map(trip => trip.linea_id)).toEqual([6]);
    expect((await listTrips(user6, { lineId: 18, stationId: 4, page: 1, pageSize: 100 })).total).toBe(0);
  });
  it("H: devuelve solo recaudación L6 y conserva 330 accesos y Q330.00", async () => {
    const result = await listTrips(user6, { state: "FINALIZADO", page: 1, pageSize: 100 });
    expect(result.items).toHaveLength(1);
    const visits = result.items[0]!.visitas;
    expect(visits.reduce((sum, visit) => sum + visit.revenue.accesses, 0)).toBe(330);
    expect(visits.map(visit => visit.revenue.estimatedRevenue)).toEqual(["100.00", "140.00", "90.00"]);
    expect(m.payments.mock.calls[0]![0].where.estacion_id.in).toEqual([5, 4, 6]);
  });
  it("I: bloquea una visita manipulada de L18 incluso cuando la siguiente estación es San Rafael", async () => {
    trips.push(makeTrip(182, 18, "EN_CURSO", [0, 0, 0]));
    await expect(recordVisit(user6, 182, { stationId: 4, peopleOff: 0, peopleBoarding: 0, demand: 0 }))
      .rejects.toMatchObject({ statusCode: 403, message: LINE_AUTHORIZATION_MESSAGE });
    expect(m.createVisit).not.toHaveBeenCalled(); expect(m.updateTrip).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  });
  it("permite registrar una visita en la línea completamente autorizada", async () => {
    trips.push(makeTrip(62, 6, "EN_CURSO"));
    await recordVisit(user6, 62, { stationId: 5, peopleOff: 0, peopleBoarding: 100, demand: 100 });
    expect(m.createVisit).toHaveBeenCalledTimes(1);
  });
  it("J: un usuario con cobertura completa de ambas líneas puede consultar y operar ambas", async () => {
    const user = { ...user6, username: "sin.nombre.de.linea", stationIds: [1, 2, 3, 4, 5, 6] };
    expect((await listOperationalLines(user)).items.map(line => line.id_linea)).toEqual([18, 6]);
    await startTrip(user, 1, 18); await startTrip(user, 5, 6);
    expect(m.createTrip).toHaveBeenCalledTimes(2);
  });
  it("recalcula cobertura con cambios de estaciones o asignaciones, sin caché permanente", async () => {
    lines[1]!.estaciones.push({ estacion_id: 7, orden: 4, activo: true, estacion: { id_estacion: 7, nombre: "Nueva estación" } });
    expect((await listOperationalLines(user6)).items).toEqual([]);
    await expect(startTrip(user6, 5, 6)).rejects.toMatchObject({ statusCode: 403 });
    expect((await listOperationalLines({ ...user6, stationIds: [...user6.stationIds, 7] })).items.map(line => line.id_linea)).toEqual([6]);
    expect((await listOperationalLines({ ...user18, stationIds: [1, 2, 3] })).items).toEqual([]);
  });
  it("no considera operable una línea vacía ni una cobertura parcial", () => {
    expect(canOperateLine(user6, [])).toBe(false);
    expect(canOperateLine(user6, lines[0]!.estaciones)).toBe(false);
    expect(canOperateLine({ ...user6, stationIds: [] }, lines[1]!.estaciones)).toBe(false);
  });
  it("la configuración inactiva antigua no amplía ni impide la cobertura vigente", async () => {
    lines[1]!.estaciones.push({ estacion_id: 99, orden: 9, activo: false, estacion: { id_estacion: 99, nombre: "Retirada" } });
    expect((await listOperationalLines(user6)).items.map(line => line.id_linea)).toEqual([6]);
  });
  it("no limita historial autorizado a líneas activas, pero sí usa su configuración actual", async () => {
    lines[1]!.activo = false;
    expect((await listOperationalLines(user6)).items).toEqual([]);
    expect((await listTrips(user6, { page: 1, pageSize: 100 })).items.map(trip => trip.linea_id)).toEqual([6]);
  });
  it("mantiene al Administrador sin restricciones y permite cancelar el recorrido inválido sin borrar visitas", async () => {
    expect(operatorLineScope(admin)).toEqual({});
    expect((await listOperationalLines(admin)).items).toHaveLength(2);
    expect((await listTrips(admin, { page: 1, pageSize: 100 })).total).toBe(2);
    await startTrip(admin, 1, 18);
    trips.push(makeTrip(182, 18, "EN_CURSO", [0]));
    const snapshot = structuredClone(trips);
    await expect(closeTrip(user6, 182, "CANCELADO")).rejects.toMatchObject({ statusCode: 403 });
    await closeTrip(admin, 182, "CANCELADO");
    expect(m.updateTrip).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ estado: "CANCELADO" }) }));
    expect(trips).toEqual(snapshot);
  });
  it.each(["línea", "bus", "asignación", "ocupado", "piloto", "parqueo"])("conserva el bloqueo por %s no disponible al iniciar", async missing => {
    if (missing === "línea") lines[1]!.activo = false;
    if (missing === "bus") m.bus.mockResolvedValue({ ...bus(5), activo: false });
    if (missing === "asignación") m.assignment.mockResolvedValue(null);
    if (missing === "ocupado") m.open.mockResolvedValue({ id_recorrido: 62n });
    if (missing === "piloto") m.pilot.mockResolvedValue(null);
    if (missing === "parqueo") m.parking.mockResolvedValue(null);
    await expect(startTrip(user6, 5, 6)).rejects.toBeInstanceOf(Error);
    expect(m.createTrip).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  });
  it("mantiene bloqueados los roles que no pueden escribir recorridos", async () => {
    await expect(startTrip({ ...user6, role: "ADMINISTRATIVO" }, 5, 6)).rejects.toMatchObject({ statusCode: 403 });
    expect(m.createTrip).not.toHaveBeenCalled();
  });
});

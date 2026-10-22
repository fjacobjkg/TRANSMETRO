import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  transaction: vi.fn(), municipality: vi.fn(), station: vi.fn(), createStation: vi.fn(), updateStation: vi.fn(),
  stations: vi.fn(), line: vi.fn(), updateLine: vi.fn(), stops: vi.fn(), removeStops: vi.fn(), addStops: vi.fn(),
  memberships: vi.fn(), openTrips: vi.fn(), openVisits: vi.fn(), operators: vi.fn(), accesses: vi.fn(), buses: vi.fn(),
  user: vi.fn(), duplicateOperator: vi.fn(), addOperator: vi.fn(), audit: vi.fn(),
  assignment: vi.fn(), otherOperators: vi.fn(), endAssignment: vi.fn(),
}));
vi.mock("../../lib/prisma.js", () => ({ prisma: { $transaction: m.transaction } }));
import { replaceLineStations, saveLine, saveStation } from "./transport-structure.service.js";
import { assignOperator, endOperatorAssignment } from "../personnel/personnel.service.js";

type Station = { id_estacion: number; codigo: string; nombre: string; municipalidad_id: number; activo: boolean };
type Stop = { linea_id: number; estacion_id: number; orden: number; distancia_siguiente: string | null; activo: boolean };
const route = [
  { stationId: 1, order: 1, distanceToNext: 1.2 }, { stationId: 2, order: 2, distanceToNext: 2.5 },
  { stationId: 3, order: 3, distanceToNext: 0.8 }, { stationId: 4, order: 4, distanceToNext: null },
];
const fleet = (count: number) => Array.from({ length: count }, (_, index) => ({ bus: {
  asignaciones_parqueo: [{ id_asignacion_bus_parqueo: index + 1 }],
  asignaciones_piloto: [{ id_asignacion_piloto_bus: index + 1 }],
} }));
let stations: Map<number, Station>;
let stops: Stop[];
let line: { id_linea: number; codigo: string; nombre: string; activo: boolean };
let operators: Set<number>;

beforeEach(() => {
  vi.resetAllMocks();
  stations = new Map(["San Martín", "Victorias", "Portales"].map((nombre, index) => [index + 1, {
    id_estacion: index + 1, codigo: `E${index + 1}`, nombre, municipalidad_id: 1, activo: true,
  }]));
  stops = [1, 2, 3].map(id => ({ linea_id: 18, estacion_id: id, orden: id,
    distancia_siguiente: id === 3 ? null : "1.2", activo: true }));
  line = { id_linea: 18, codigo: "L18", nombre: "Línea 18", activo: false };
  operators = new Set([1, 2, 3]);
  m.transaction.mockImplementation(async fn => fn({
    municipalidad: { findUnique: m.municipality },
    estacion: { findUnique: m.station, create: m.createStation, update: m.updateStation, findMany: m.stations },
    linea: { findUnique: m.line, update: m.updateLine },
    linea_estacion: { findMany: m.stops, deleteMany: m.removeStops, createMany: m.addStops, count: m.memberships },
    recorrido: { count: m.openTrips }, visita: { count: m.openVisits },
    asignacion_usuario_estacion: { findMany: m.operators, findFirst: m.duplicateOperator, create: m.addOperator,
      findUnique: m.assignment, count: m.otherOperators, update: m.endAssignment },
    acceso: { findMany: m.accesses }, asignacion_bus_linea: { findMany: m.buses },
    usuario: { findUnique: m.user }, bitacora: { create: m.audit },
  }));
  m.municipality.mockResolvedValue({ id_municipalidad: 1, activo: true });
  m.station.mockImplementation(async ({ where }) => stations.get(where.id_estacion) ?? null);
  m.createStation.mockImplementation(async ({ data }) => {
    const station = { id_estacion: 4, ...data } as Station;
    stations.set(station.id_estacion, station); return station;
  });
  m.updateStation.mockImplementation(async ({ where, data }) => {
    const station = { ...stations.get(where.id_estacion)!, ...data } as Station;
    stations.set(where.id_estacion, station); return station;
  });
  m.stations.mockImplementation(async ({ where }) =>
    where.id_estacion.in.filter((id: number) => stations.has(id)).map((id: number) => stations.get(id)));
  m.line.mockImplementation(async () => ({ ...line, estaciones: stops.filter(stop => stop.activo)
    .sort((a, b) => a.orden - b.orden).map(stop => ({ ...stop, estacion: stations.get(stop.estacion_id) })),
  }));
  m.updateLine.mockImplementation(async ({ data }) => { Object.assign(line, data); return { ...line }; });
  m.stops.mockImplementation(async () => stops.map(stop => ({ ...stop, estacion: stations.get(stop.estacion_id) })));
  m.removeStops.mockImplementation(async () => { stops = []; return { count: 3 }; });
  m.addStops.mockImplementation(async ({ data }) => { stops.push(...data); return { count: data.length }; });
  m.memberships.mockImplementation(async ({ where }) =>
    stops.filter(stop => stop.estacion_id === where.estacion_id && stop.activo && (!where.linea?.activo || line.activo)).length);
  m.openTrips.mockResolvedValue(0); m.openVisits.mockResolvedValue(0);
  m.operators.mockImplementation(async ({ where }) =>
    [...operators].filter(id => where.estacion_id.in.includes(id)).map(estacion_id => ({ estacion_id })));
  m.accesses.mockResolvedValue([1, 2, 3, 4].map(estacion_id => ({ estacion_id,
    asignaciones_guardia: [{ id_asignacion_guardia_acceso: estacion_id }],
  })));
  m.buses.mockResolvedValue(fleet(4));
  m.user.mockResolvedValue({ id_usuario: 12, nombre_usuario: "operador18", activo: true,
    rol: { nombre: "OPERADOR_ESTACION", activo: true } });
  m.duplicateOperator.mockResolvedValue(null);
  m.addOperator.mockImplementation(async ({ data }) => {
    operators.add(data.estacion_id); return { id_asignacion_usuario_estacion: 4, ...data };
  });
  m.assignment.mockResolvedValue({ id_asignacion_usuario_estacion: 4, estacion_id: 4, fecha_fin: null,
    estacion: { codigo: "SR" } });
  m.otherOperators.mockResolvedValue(0);
});

const createSanRafael = () => saveStation(1, { code: "SR", name: "San Rafael", municipalityId: 1 });
async function prepareSanRafael() { await createSanRafael(); await replaceLineStations(1, 18, route); }
async function activateSanRafael() { await prepareSanRafael(); await saveStation(1, { active: true }, 4); }
async function completeStaffing() { await activateSanRafael(); await assignOperator(1, 12, 4); }

describe("San Rafael: preparación gradual sin dependencia circular", () => {
  it("crea la estación inactiva y exige municipalidad activa", async () => {
    expect(await createSanRafael()).toMatchObject({ codigo: "SR", nombre: "San Rafael", activo: false, municipalidad_id: 1 });
    m.municipality.mockResolvedValue({ activo: false });
    await expect(createSanRafael()).rejects.toThrow("municipalidad activa");
  });
  it("no permite crear una estación activa sin asociación previa", async () => {
    await expect(saveStation(1, { code: "SR", name: "San Rafael", municipalityId: 1, active: true }))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(m.createStation).not.toHaveBeenCalled();
  });
  it("guarda San Martín → Victorias → Portales → San Rafael sin activar ni exigir personal o flota", async () => {
    await prepareSanRafael();
    expect(stops.map(stop => stations.get(stop.estacion_id)?.nombre)).toEqual(["San Martín", "Victorias", "Portales", "San Rafael"]);
    expect(stops.map(stop => stop.orden)).toEqual([1, 2, 3, 4]);
    expect(stops.map(stop => stop.distancia_siguiente)).toEqual(["1.2", "2.5", "0.8", null]);
    expect(stations.get(4)?.activo).toBe(false); expect(line.activo).toBe(false);
    expect(m.updateStation).not.toHaveBeenCalled(); expect(m.operators).not.toHaveBeenCalled();
    expect(m.accesses).not.toHaveBeenCalled(); expect(m.buses).not.toHaveBeenCalled();
  });
  it("impide activar sin línea y permite activar después de asociar", async () => {
    await createSanRafael();
    await expect(saveStation(1, { active: true }, 4)).rejects.toThrow("por lo menos a una línea");
    expect(stations.get(4)?.activo).toBe(false);
    await replaceLineStations(1, 18, route); await saveStation(1, { active: true }, 4);
    expect(stations.get(4)?.activo).toBe(true);
  });
  it("asigna el operador solo después de activar la estación", async () => {
    await prepareSanRafael();
    await expect(assignOperator(1, 12, 4)).rejects.toThrow("estación activa");
    expect(m.addOperator).not.toHaveBeenCalled();
    await saveStation(1, { active: true }, 4); await assignOperator(1, 12, 4);
    expect(operators.has(4)).toBe(true);
  });
  it("bloquea la habilitación sin operador y permite completarla después", async () => {
    await activateSanRafael();
    await expect(saveLine(1, { active: true }, 18)).rejects.toThrow("operador vigente");
    expect(line.activo).toBe(false); expect(m.updateLine).not.toHaveBeenCalled();
    await assignOperator(1, 12, 4); await saveLine(1, { active: true }, 18);
    expect(line.activo).toBe(true);
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ accion: "HABILITAR", entidad: "linea" }) }));
  });
  it("exige deshabilitar primero una línea operativa y no cambia su estado automáticamente", async () => {
    line.activo = true; await createSanRafael();
    await expect(replaceLineStations(1, 18, route)).rejects.toThrow("Deshabilita la línea");
    expect(line.activo).toBe(true); expect(m.removeStops).not.toHaveBeenCalled();
    await saveLine(1, { active: false }, 18); await replaceLineStations(1, 18, route);
    expect(stops).toHaveLength(4); expect(stations.get(4)?.activo).toBe(false);
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ accion: "DESHABILITAR" }) }));
  });
  it("conserva el bloqueo de recorridos abiertos", async () => {
    m.openTrips.mockResolvedValue(1);
    await expect(replaceLineStations(1, 18, route)).rejects.toThrow("recorridos abiertos");
    expect(m.removeStops).not.toHaveBeenCalled();
  });
  it("rechaza estaciones inexistentes antes de modificar asociaciones", async () => {
    await expect(replaceLineStations(1, 18, [{ stationId: 999, order: 1, distanceToNext: null }]))
      .rejects.toThrow("Todas las estaciones deben existir");
    expect(m.removeStops).not.toHaveBeenCalled();
  });
  it.each([
    { input: [{ stationId: 1, order: 1 }, { stationId: 1, order: 2 }] },
    { input: [{ stationId: 1, order: 1 }, { stationId: 2, order: 3 }] },
    { input: [{ stationId: 1, order: 1, distanceToNext: -1 }, { stationId: 2, order: 2 }] },
    { input: [{ stationId: 1, order: 1, distanceToNext: 1 }] }, { input: [] },
  ])("conserva la validación estructural: $input", async ({ input }) => {
    await expect(replaceLineStations(1, 18, input)).rejects.toMatchObject({ statusCode: 400 });
    expect(m.removeStops).not.toHaveBeenCalled();
  });
});

describe("Requisitos completos al habilitar la línea", () => {
  it("exige estaciones configuradas y activas", async () => {
    stops = [];
    await expect(saveLine(1, { active: true }, 18)).rejects.toThrow("Agrega estaciones");
    await prepareSanRafael();
    await expect(saveLine(1, { active: true }, 18)).rejects.toThrow("Activa todas las estaciones");
    expect(m.updateLine).not.toHaveBeenCalled();
  });
  it("exige orden consecutivo y distancias completas", async () => {
    await completeStaffing(); stops[0]!.orden = 9;
    await expect(saveLine(1, { active: true }, 18)).rejects.toThrow("orden consecutivo");
    stops[0]!.orden = 1; stops[0]!.distancia_siguiente = null;
    await expect(saveLine(1, { active: true }, 18)).rejects.toThrow("distancias");
    expect(m.updateLine).not.toHaveBeenCalled();
  });
  it.each(["sin acceso", "sin guardia"])("bloquea una estación %s", async missing => {
    await completeStaffing();
    m.accesses.mockResolvedValue([1, 2, 3, ...(missing === "sin acceso" ? [] : [4])].map(estacion_id => ({
      estacion_id, asignaciones_guardia: estacion_id === 4 ? [] : [{ id_asignacion_guardia_acceso: estacion_id }],
    })));
    await expect(saveLine(1, { active: true }, 18)).rejects.toThrow("accesos activos");
    expect(m.updateLine).not.toHaveBeenCalled();
  });
  it.each([3, 9])("bloquea %i buses fuera del rango 4..8", async count => {
    await completeStaffing(); m.buses.mockResolvedValue(fleet(count));
    await expect(saveLine(1, { active: true }, 18)).rejects.toThrow("entre 4 y 8 buses");
    expect(m.updateLine).not.toHaveBeenCalled();
  });
  it.each([4, 8])("permite habilitar con %i buses y los requisitos completos", async count => {
    await completeStaffing(); m.buses.mockResolvedValue(fleet(count));
    await saveLine(1, { active: true }, 18); expect(line.activo).toBe(true);
  });
  it.each(["parqueo", "piloto"] as const)("bloquea un bus sin %s vigente", async missing => {
    await completeStaffing(); const buses = fleet(4);
    if (missing === "parqueo") buses[0]!.bus.asignaciones_parqueo = [];
    else buses[0]!.bus.asignaciones_piloto = [];
    m.buses.mockResolvedValue(buses);
    await expect(saveLine(1, { active: true }, 18)).rejects.toThrow(missing);
    expect(m.updateLine).not.toHaveBeenCalled();
  });
  it("consulta únicamente operadores, parqueos y pilotos vigentes y activos", async () => {
    await completeStaffing(); await saveLine(1, { active: true }, 18);
    expect(m.operators).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      fecha_fin: null, fecha_inicio: { lte: expect.any(Date) },
      usuario: { activo: true, rol: { activo: true, nombre: "OPERADOR_ESTACION" } },
    }) }));
    expect(m.buses).toHaveBeenCalledWith(expect.objectContaining({
      where: { linea_id: 18, fecha_fin: null, fecha_inicio: { lte: expect.any(Date) }, bus: { activo: true } },
      select: { bus: { select: {
        asignaciones_parqueo: { where: { fecha_fin: null, fecha_inicio: { lte: expect.any(Date) },
          parqueo: { activo: true, estacion: { activo: true } } }, select: { id_asignacion_bus_parqueo: true } },
        asignaciones_piloto: { where: { fecha_fin: null, fecha_inicio: { lte: expect.any(Date) },
          piloto: { activo: true } }, select: { id_asignacion_piloto_bus: true } },
      } } },
    }));
  });
  it("conserva RN-16 al impedir retirar al último operador de una estación operativa", async () => {
    await completeStaffing(); await saveLine(1, { active: true }, 18);
    await expect(endOperatorAssignment(1, 4)).rejects.toThrow("conservar al menos un operador");
    expect(m.endAssignment).not.toHaveBeenCalled();
  });
  it("conserva RN-02 al retirar la última asociación y respeta estaciones compartidas", async () => {
    await completeStaffing();
    await replaceLineStations(1, 18, [{ stationId: 1, order: 1, distanceToNext: null }]);
    expect(stations.get(4)?.activo).toBe(false);
    m.memberships.mockResolvedValue(1);
    await replaceLineStations(1, 18, [{ stationId: 2, order: 1, distanceToNext: null }]);
    expect(stations.get(1)?.activo).toBe(true);
  });
});

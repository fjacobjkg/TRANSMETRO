import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ transaction: vi.fn(), bus: vi.fn(), pilot: vi.fn(), query: vi.fn(), findMany: vi.fn(),
  create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), lineAssignment: vi.fn(),
  line: vi.fn(), lineCount: vi.fn(), lineCreate: vi.fn(), parking: vi.fn(), open: vi.fn(), openCount: vi.fn(), tripCreate: vi.fn(), audit: vi.fn(),
  rows: [] as Array<{ id_asignacion_piloto_bus: number; piloto_id: number; bus_id: number; fecha_inicio: Date; fecha_fin: Date | null }> }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { $transaction: m.transaction } }));
import { assignPilotBus, endPilotBus } from "./pilot-bus.service.js";
import { assignBusLine } from "../fleet/fleet.service.js";
import { startTrip } from "../route-operation/route-operation.service.js";
const actor = { id: 1, name: "Admin", username: "admin", role: "ADMIN" as const, stationIds: [] };
const assignment = (pilot = 1, bus = 1) => ({ id_asignacion_piloto_bus: 1, piloto_id: pilot, bus_id: bus, fecha_inicio: new Date("2026-01-01T00:00:00Z"), fecha_fin: null });

describe("Asignación temporal piloto–bus y uso operativo", () => {
  beforeEach(() => {
    vi.resetAllMocks(); m.rows.length = 0;
    m.transaction.mockImplementation(async fn => fn({ $queryRaw: m.query, piloto: { findUnique: m.pilot }, bus: { findUnique: m.bus },
      asignacion_piloto_bus: { findMany: m.findMany, create: m.create, updateMany: m.updateMany, findFirst: m.findFirst, findUnique: m.findUnique, update: m.update },
      asignacion_bus_linea: { findFirst: m.lineAssignment, count: m.lineCount, create: m.lineCreate },
      asignacion_bus_parqueo: { findFirst: m.parking }, linea: { findUnique: m.line },
      recorrido: { count: m.openCount, findFirst: m.open, create: m.tripCreate }, bitacora: { create: m.audit } }));
    m.bus.mockImplementation(async ({ where }) => ({ id_bus: where.id_bus, codigo: "BUS", activo: true }));
    m.pilot.mockImplementation(async ({ where }) => ({ id_piloto: where.id_piloto, nombre: "Piloto", activo: true }));
    m.findMany.mockImplementation(async ({ where }) => m.rows.filter(row =>
      (where.fecha_fin === null ? row.fecha_fin === null : row.fecha_fin !== null) && where.OR.some((filter: { piloto_id?: number; bus_id?: number }) =>
        filter.piloto_id === row.piloto_id || filter.bus_id === row.bus_id)).sort((a, b) => (b.fecha_fin?.getTime() ?? 0) - (a.fecha_fin?.getTime() ?? 0)));
    m.create.mockImplementation(async ({ data }) => { const row = { id_asignacion_piloto_bus: m.rows.length + 1, fecha_fin: null, ...data }; m.rows.push(row); return row; });
    m.updateMany.mockImplementation(async ({ where, data }) => { m.rows.filter(row => where.id_asignacion_piloto_bus.in.includes(row.id_asignacion_piloto_bus)).forEach(row => Object.assign(row, data)); return { count: 1 }; });
    m.findFirst.mockImplementation(async ({ where }) => m.rows.find(row => row.bus_id === where.bus_id && row.fecha_fin === null));
    m.findUnique.mockImplementation(async ({ where }) => m.rows.find(row => row.id_asignacion_piloto_bus === where.id_asignacion_piloto_bus));
    m.update.mockImplementation(async ({ where, data }) => Object.assign(m.rows.find(row => row.id_asignacion_piloto_bus === where.id_asignacion_piloto_bus)!, data));
    m.openCount.mockResolvedValue(0); m.lineAssignment.mockResolvedValue(null); m.lineCount.mockResolvedValue(0);
    m.line.mockResolvedValue({ id_linea: 18, activo: true, estaciones: [{ estacion_id: 1 }, { estacion_id: 2 }] });
    m.parking.mockResolvedValue({ id: 1 }); m.open.mockResolvedValue(null);
    m.tripCreate.mockResolvedValue({ id_recorrido: 1n }); m.lineCreate.mockResolvedValue({ id_asignacion_bus_linea: 1 });
  });
  it("asigna piloto activo a bus activo y registra bitácora", async () => {
    await assignPilotBus(1, 1, 1);
    expect(m.rows).toHaveLength(1); expect(m.rows[0]).toMatchObject({ piloto_id: 1, bus_id: 1, fecha_fin: null });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ accion: "ASIGNAR_PILOTO_BUS", usuario_id: 1 }) }));
    expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });
  it("impide asignación personal sobre un bus con otro piloto", async () => {
    m.rows.push(assignment());
    await expect(assignPilotBus(1, 2, 1)).rejects.toMatchObject({ statusCode: 409 }); expect(m.create).not.toHaveBeenCalled();
  });
  it("impide seleccionar en Buses un piloto que ya ocupa otro bus", async () => {
    m.rows.push(assignment());
    await expect(assignPilotBus(1, 1, 2, undefined, true)).rejects.toMatchObject({ statusCode: 409 }); expect(m.create).not.toHaveBeenCalled();
  });
  it("reasigna bus desde Pilotos conservando historial y una sola asignación vigente", async () => {
    m.rows.push(assignment()); await assignPilotBus(1, 1, 2);
    expect(m.rows[0]?.fecha_fin).toBeInstanceOf(Date);
    expect(m.rows.filter(row => row.fecha_fin === null)).toHaveLength(1);
    expect(m.rows[1]).toMatchObject({ piloto_id: 1, bus_id: 2 });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ accion: "REASIGNAR_PILOTO_BUS" }) }));
  });
  it("reemplaza piloto del bus en una transacción sin abandonar su línea", async () => {
    m.rows.push(assignment()); m.lineAssignment.mockResolvedValue({ linea_id: 18 });
    await assignPilotBus(1, 2, 1, undefined, true);
    expect(m.rows[0]?.fecha_fin).toBeInstanceOf(Date); expect(m.rows[1]).toMatchObject({ piloto_id: 2, bus_id: 1, fecha_fin: null });
  });
  it("impide cambio o finalización con recorrido EN_CURSO", async () => {
    m.rows.push(assignment()); m.openCount.mockResolvedValue(1);
    await expect(assignPilotBus(1, 2, 1, undefined, true)).rejects.toThrow("EN_CURSO");
    await expect(endPilotBus(1, 1)).rejects.toThrow("EN_CURSO"); expect(m.updateMany).not.toHaveBeenCalled();
  });
  it("impide dejar sin piloto un bus incorporado a una línea", async () => {
    m.rows.push(assignment()); m.lineAssignment.mockResolvedValue({ linea_id: 18 });
    await expect(assignPilotBus(1, 1, 2)).rejects.toThrow("sin piloto");
    await expect(endPilotBus(1, 1)).rejects.toThrow("Reasignar piloto");
  });
  it("finaliza la asignación de un bus libre sin borrar historial", async () => {
    m.rows.push(assignment()); await endPilotBus(1, 1); expect(m.rows[0]?.fecha_fin).toBeInstanceOf(Date); expect(m.rows).toHaveLength(1);
  });
  it.each(["pilot", "bus"] as const)("rechaza %s inactivo", async key => {
    m[key].mockResolvedValue({ activo: false }); await expect(assignPilotBus(1, 1, 1)).rejects.toMatchObject({ statusCode: 400 });
  });
  it("rechaza fechas futuras y superpuestas con el historial", async () => {
    await expect(assignPilotBus(1, 1, 1, "2999-01-01T00:00:00Z")).rejects.toMatchObject({ statusCode: 400 });
    m.rows.push({ ...assignment(), fecha_fin: new Date("2026-02-01T00:00:00Z") });
    await expect(assignPilotBus(1, 1, 1, "2026-01-15T00:00:00Z")).rejects.toThrow("superpone");
  });
  it("impide bus → línea sin piloto, incluso si la asignación de línea ya existía", async () => {
    await expect(assignBusLine(1, 1, 18)).rejects.toThrow("piloto asignado");
    m.lineAssignment.mockResolvedValue({ linea_id: 18 });
    await expect(assignBusLine(1, 1, 18)).rejects.toThrow("piloto asignado"); expect(m.lineCreate).not.toHaveBeenCalled();
  });
  it("permite bus → línea con piloto vigente", async () => {
    m.rows.push(assignment()); await assignBusLine(1, 1, 18); expect(m.lineCreate).toHaveBeenCalled();
  });
  it("impide iniciar recorrido sin piloto", async () => {
    m.lineAssignment.mockResolvedValue({ linea_id: 18 });
    await expect(startTrip(actor, 1, 18)).rejects.toThrow("piloto vigente"); expect(m.tripCreate).not.toHaveBeenCalled();
  });
  it("permite iniciar recorrido con piloto y parqueo vigentes", async () => {
    m.rows.push(assignment()); m.lineAssignment.mockResolvedValue({ linea_id: 18 });
    await startTrip(actor, 1, 18); expect(m.tripCreate).toHaveBeenCalled();
  });
  it("rechaza inicio sin parqueo, bus inactivo o sin asignación de línea", async () => {
    m.rows.push(assignment()); m.lineAssignment.mockResolvedValue({ linea_id: 18 }); m.parking.mockResolvedValue(null);
    await expect(startTrip(actor, 1, 18)).rejects.toThrow("parqueo vigente");
    m.parking.mockResolvedValue({ id: 1 }); m.bus.mockResolvedValue({ activo: false });
    await expect(startTrip(actor, 1, 18)).rejects.toThrow("asignación vigente");
    m.bus.mockResolvedValue({ activo: true }); m.lineAssignment.mockResolvedValue(null);
    await expect(startTrip(actor, 1, 18)).rejects.toThrow("asignación vigente");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ transaction: vi.fn(), access: vi.fn(), station: vi.fn(), accessUpdate: vi.fn(),
  assignment: vi.fn(), assignmentUpdate: vi.fn(), coverage: vi.fn(), activeLines: vi.fn(), otherAccesses: vi.fn(), audit: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { $transaction: m.transaction } }));
import { endGuardAssignment, saveAccess } from "./access-security.service.js";
import { accessUpdateSchema } from "./access-security.schema.js";

type Access = { id_acceso: number; nombre: string; estacion_id: number; activo: boolean };
type Assignment = { id_asignacion_guardia_acceso: number; acceso_id: number; guardia_id: number; fecha_inicio: Date; fecha_fin: Date | null };
let accesses: Map<number, Access>;
let assignments: Map<number, Assignment>;
let guards: Map<number, { nombre: string; activo: boolean }>;
let stations: Map<number, { activo: boolean }>;

beforeEach(() => {
  vi.resetAllMocks();
  accesses = new Map([
    [10, { id_acceso: 10, nombre: "Acceso Principal Zona 6 Centro", estacion_id: 1, activo: false }],
    [11, { id_acceso: 11, nombre: "Acceso Principal Zona 6 Norte", estacion_id: 1, activo: true }],
  ]);
  guards = new Map([[20, { nombre: "Guardia Zona 6 Centro", activo: true }], [21, { nombre: "Guardia Zona 6 Norte", activo: true }]]);
  stations = new Map([[1, { activo: true }], [2, { activo: true }]]);
  assignments = new Map([[30, 10, 20], [31, 10, 21], [32, 11, 21]].map(([id, access, guard]) => [id!, {
    id_asignacion_guardia_acceso: id!, acceso_id: access!, guardia_id: guard!, fecha_inicio: new Date("2026-01-01T00:00:00Z"), fecha_fin: null,
  }]));
  m.transaction.mockImplementation(async fn => fn({
    acceso: { findUnique: m.access, update: m.accessUpdate, count: m.otherAccesses },
    estacion: { findUnique: m.station }, linea_estacion: { count: m.activeLines },
    asignacion_guardia_acceso: { findUnique: m.assignment, update: m.assignmentUpdate, count: m.coverage },
    bitacora: { create: m.audit },
  }));
  m.access.mockImplementation(async ({ where }) => accesses.get(where.id_acceso) ?? null);
  m.station.mockImplementation(async ({ where }) => stations.get(where.id_estacion) ?? null);
  m.accessUpdate.mockImplementation(async ({ where, data }) => {
    const access = { ...accesses.get(where.id_acceso)!, ...data } as Access;
    accesses.set(where.id_acceso, access); return access;
  });
  m.assignment.mockImplementation(async ({ where }) => {
    const entry = assignments.get(where.id_asignacion_guardia_acceso);
    return entry ? { ...entry, acceso: accesses.get(entry.acceso_id), guardia: guards.get(entry.guardia_id) } : null;
  });
  m.assignmentUpdate.mockImplementation(async ({ where, data }) => {
    const entry = { ...assignments.get(where.id_asignacion_guardia_acceso)!, ...data } as Assignment;
    assignments.set(where.id_asignacion_guardia_acceso, entry); return entry;
  });
  m.coverage.mockImplementation(async ({ where }) => [...assignments.values()].filter(entry =>
    entry.acceso_id === where.acceso_id && entry.fecha_fin === null &&
    entry.fecha_inicio <= where.fecha_inicio.lte && entry.id_asignacion_guardia_acceso !== where.id_asignacion_guardia_acceso?.not &&
    guards.get(entry.guardia_id)?.activo === true).length);
  m.activeLines.mockResolvedValue(0); m.otherAccesses.mockResolvedValue(1);
});

describe("Finalizar asignaciones guardia–acceso sin eliminar registros", () => {
  it("permite finalizar todas las asignaciones de un acceso inactivo, conserva fechas e historial y audita", async () => {
    const started = assignments.get(30)!.fecha_inicio;
    await endGuardAssignment(1, 30); await endGuardAssignment(1, 31);
    expect(assignments.size).toBe(3); expect(guards.size).toBe(2);
    expect(assignments.get(30)).toMatchObject({ fecha_inicio: started, fecha_fin: expect.any(Date) });
    expect(assignments.get(31)?.fecha_fin).toBeInstanceOf(Date);
    expect(m.coverage).not.toHaveBeenCalled();
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      accion: "CERRAR_ASIGNACION", entidad: "asignacion_guardia_acceso", entidad_id: 30, usuario_id: 1,
    }) }));
    expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });
  it("bloquea al último guardia del acceso activo y explica las alternativas", async () => {
    await expect(endGuardAssignment(1, 32)).rejects.toThrow("Primero deshabilita el acceso o asigna otro guardia");
    expect(assignments.get(32)?.fecha_fin).toBeNull(); expect(m.assignmentUpdate).not.toHaveBeenCalled();
  });
  it("permite finalizar una asignación si el acceso activo conserva otro guardia vigente", async () => {
    accesses.get(10)!.activo = true;
    await endGuardAssignment(1, 31);
    expect(assignments.get(31)?.fecha_fin).toBeInstanceOf(Date);
    expect(assignments.get(30)?.fecha_fin).toBeNull(); expect(accesses.get(10)?.activo).toBe(true);
  });
  it.each(["guardia inactivo", "asignación futura", "asignación finalizada"])("no cuenta como relevo una %s", async condition => {
    accesses.get(10)!.activo = true;
    if (condition === "guardia inactivo") guards.get(20)!.activo = false;
    if (condition === "asignación futura") assignments.get(30)!.fecha_inicio = new Date("2999-01-01T00:00:00Z");
    if (condition === "asignación finalizada") assignments.get(30)!.fecha_fin = new Date();
    await expect(endGuardAssignment(1, 31)).rejects.toMatchObject({ statusCode: 409 });
    expect(m.assignmentUpdate).not.toHaveBeenCalled();
  });
  it("rechaza asignaciones inexistentes o ya finalizadas sin sobrescribir el historial", async () => {
    await expect(endGuardAssignment(1, 999)).rejects.toMatchObject({ statusCode: 404 });
    await endGuardAssignment(1, 31);
    const ended = assignments.get(31)!.fecha_fin;
    await expect(endGuardAssignment(1, 31)).rejects.toMatchObject({ statusCode: 404 });
    expect(assignments.get(31)?.fecha_fin).toBe(ended);
  });
});

describe("Edición segura de estación y corrección Zona 6", () => {
  it("acepta stationId en el esquema de edición y rechaza identificadores inválidos", () => {
    expect(accessUpdateSchema.parse({ stationId: 2 })).toEqual({ stationId: 2 });
    expect(accessUpdateSchema.safeParse({ stationId: 0 }).success).toBe(false);
    expect(accessUpdateSchema.safeParse({ stationId: -1 }).success).toBe(false);
    expect(accessUpdateSchema.safeParse({}).success).toBe(false);
  });
  it("mueve un acceso inactivo a una estación activa y audita origen y destino", async () => {
    await saveAccess(1, { stationId: 2 }, 10);
    expect(accesses.get(10)).toMatchObject({ estacion_id: 2, activo: false });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      accion: "ACTUALIZAR", descripcion: "Acceso Principal Zona 6 Centro · estación 1 → 2",
    }) }));
  });
  it.each([{}, { active: false }])("bloquea mover un acceso activo aunque se envíe desactivar en la misma petición: %j", async extra => {
    await expect(saveAccess(1, { stationId: 2, ...extra }, 11)).rejects.toThrow("Deshabilita el acceso antes");
    expect(m.accessUpdate).not.toHaveBeenCalled();
  });
  it("permite editar el nombre de un acceso activo sin cambiar su estación", async () => {
    await saveAccess(1, { stationId: 1, name: "Acceso Norte" }, 11);
    expect(accesses.get(11)).toMatchObject({ nombre: "Acceso Norte", estacion_id: 1, activo: true });
  });
  it.each([false, null])("rechaza la estación de destino inactiva o inexistente: %j", async target => {
    if (target === null) stations.delete(2); else stations.get(2)!.activo = target;
    await expect(saveAccess(1, { stationId: 2 }, 10)).rejects.toThrow("estación activa");
    expect(m.accessUpdate).not.toHaveBeenCalled();
  });
  it("conserva las reglas de activación y de acceso mínimo en una línea activa", async () => {
    await endGuardAssignment(1, 30); await endGuardAssignment(1, 31);
    await expect(saveAccess(1, { active: true }, 10)).rejects.toThrow("Asigna un guardia vigente");
    m.activeLines.mockResolvedValue(1); m.otherAccesses.mockResolvedValue(0);
    await expect(saveAccess(1, { active: false }, 11)).rejects.toThrow("conservar por lo menos un acceso cubierto");
    expect(m.accessUpdate).not.toHaveBeenCalled();
  });
  it("no permite crear un acceso activo sin asignar antes un guardia", async () => {
    await expect(saveAccess(1, { stationId: 2, name: "Nuevo", active: true })).rejects.toThrow("asigna un guardia");
  });
  it("no permite habilitar un acceso cuya estación esté inactiva", async () => {
    stations.get(1)!.activo = false;
    await expect(saveAccess(1, { active: true }, 10)).rejects.toThrow("estación activa");
    expect(m.accessUpdate).not.toHaveBeenCalled();
  });
  it("corrige Centro sin alterar el acceso Norte, sus guardias ni el historial", async () => {
    const northAccess = structuredClone(accesses.get(11));
    const northAssignment = structuredClone(assignments.get(32));
    const originalGuards = structuredClone(guards);
    await endGuardAssignment(1, 31);
    await saveAccess(1, { stationId: 2 }, 10);
    await saveAccess(1, { active: true }, 10);
    expect(accesses.get(10)).toMatchObject({ estacion_id: 2, activo: true });
    expect(assignments.get(30)).toMatchObject({ guardia_id: 20, acceso_id: 10, fecha_fin: null });
    expect(assignments.get(31)?.fecha_fin).toBeInstanceOf(Date);
    expect(accesses.get(11)).toEqual(northAccess); expect(assignments.get(32)).toEqual(northAssignment);
    expect(guards).toEqual(originalGuards); expect(assignments.size).toBe(3);
  });
});

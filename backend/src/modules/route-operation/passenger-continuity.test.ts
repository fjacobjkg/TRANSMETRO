import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ trip: vi.fn(), assignment: vi.fn(), createVisit: vi.fn(), updateTrip: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { $transaction: mocks.transaction } }));
import { recordVisit } from "./route-operation.service.js";
import { calculateDepartureOccupancy, evaluateVisit } from "./route-operation.rules.js";
import { visitSchema } from "./route-operation.schema.js";

const actor = { id: 1, name: "Operador", username: "operador", role: "OPERADOR_ESTACION" as const, stationIds: [1, 2, 3] };
const previousVisit = { estacion_id: 1, orden: 1, ocupacion: 100, fecha_hora: new Date("2026-09-29T10:10:00Z") };
const makeTrip = (visits = [previousVisit]) => ({ id_recorrido: 1n, estado: "EN_CURSO", fecha_inicio: new Date("2026-09-29T10:00:00Z"),
  bus_id: 1, linea_id: 1, bus: { capacidad_maxima: 250 },
  linea: { estaciones: [1, 2, 3].map(id => ({ estacion_id: id, orden: id })) }, visitas: visits });

describe("Continuidad de pasajeros", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn({
      recorrido: { findUnique: mocks.trip, update: mocks.updateTrip }, asignacion_bus_linea: { findFirst: mocks.assignment },
      visita: { create: mocks.createVisit }, bitacora: { create: mocks.audit },
    }));
    mocks.trip.mockResolvedValue(makeTrip()); mocks.assignment.mockResolvedValue({ id: 1 });
    mocks.createVisit.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id_visita: 2n, ...data }));
  });
  it("calcula 170 al salir y conserva los movimientos en la transacción", async () => {
    const result = await recordVisit(actor, 1, { stationId: 2, peopleOff: 30, peopleBoarding: 100, demand: 120 });
    expect(result.visit).toMatchObject({ ocupacion: 170, personas_bajan: 30, personas_abordan: 100, demanda: 120 });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
    expect(mocks.audit).toHaveBeenCalled();
  });
  it.each([
    [{ peopleOff: 101, peopleBoarding: 0, demand: 0 }, "No pueden bajar"],
    [{ peopleOff: 0, peopleBoarding: 51, demand: 50 }, "No pueden abordar"],
    [{ peopleOff: 0, peopleBoarding: 151, demand: 151 }, "capacidad máxima"],
    [{ peopleOff: -1, peopleBoarding: 0, demand: 0 }, "enteros no negativos"],
    [{ peopleOff: 0.5, peopleBoarding: 0, demand: 0 }, "enteros no negativos"],
  ])("rechaza movimientos inválidos antes de escribir: %j", async (input, message) => {
    await expect(recordVisit(actor, 1, { stationId: 2, ...input })).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining(message) });
    expect(mocks.createVisit).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("rechaza el caso 200 + 60 para un bus de 250", () => {
    expect(() => calculateDepartureOccupancy(250, 200, 0, 60, 60)).toThrow("capacidad máxima");
  });
  it("la primera visita llega con cero y la siguiente recupera la ocupación persistida", async () => {
    mocks.trip.mockResolvedValueOnce(makeTrip([]));
    const first = await recordVisit(actor, 1, { stationId: 1, peopleOff: 0, peopleBoarding: 100, demand: 100 });
    expect(first.visit.ocupacion).toBe(100);
    // Another request reloads the trip from persistence rather than retaining client state.
    mocks.trip.mockResolvedValueOnce(makeTrip([{ ...previousVisit, ocupacion: first.visit.ocupacion }]));
    const second = await recordVisit(actor, 1, { stationId: 2, peopleOff: 30, peopleBoarding: 150, demand: 375 });
    expect(second.visit.ocupacion).toBe(220); expect(second.evaluation.extraUnit).toBe(true);
  });
  it("evalúa demanda 375 y espera con ocupación de salida 50", async () => {
    const result = await recordVisit(actor, 1, { stationId: 2, peopleOff: 50, peopleBoarding: 0, demand: 375 });
    expect(result.evaluation).toMatchObject({ extraUnit: true, extraWaitMinutes: 5, capacity: 250 });
    expect(evaluateVisit(250, 63, 374)).toEqual({ extraUnit: false, extraWaitMinutes: 0 });
  });
  it("mantiene la autorización por estación y el orden", async () => {
    await expect(recordVisit({ ...actor, stationIds: [1, 3] }, 1, { stationId: 2, peopleOff: 0, peopleBoarding: 0, demand: 0 })).rejects.toMatchObject({ statusCode: 403 });
    await expect(recordVisit(actor, 1, { stationId: 3, peopleOff: 0, peopleBoarding: 0, demand: 0 })).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.createVisit).not.toHaveBeenCalled();
  });
  it("rechaza recorridos cerrados y asignaciones de bus vencidas", async () => {
    mocks.trip.mockResolvedValueOnce({ ...makeTrip(), estado: "FINALIZADO" });
    await expect(recordVisit(actor, 1, { stationId: 2, peopleOff: 0, peopleBoarding: 0, demand: 0 })).rejects.toMatchObject({ statusCode: 404 });
    mocks.assignment.mockResolvedValueOnce(null);
    await expect(recordVisit(actor, 1, { stationId: 2, peopleOff: 0, peopleBoarding: 0, demand: 0 })).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.createVisit).not.toHaveBeenCalled();
  });
  it("la última visita finaliza el recorrido y registra la trazabilidad", async () => {
    mocks.trip.mockResolvedValueOnce(makeTrip([previousVisit, { ...previousVisit, estacion_id: 2, orden: 2, ocupacion: 220 }]));
    const result = await recordVisit(actor, 1, { stationId: 3, peopleOff: 170, peopleBoarding: 10, demand: 10 });
    expect(result.visit.ocupacion).toBe(60); expect(result.completed).toBe(true);
    expect(mocks.updateTrip).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ estado: "FINALIZADO" }) }));
    expect(mocks.audit).toHaveBeenCalledTimes(2);
  });
  it("el payload requiere movimientos y descarta occupancy suministrado por el cliente", () => {
    expect(visitSchema.safeParse({ stationId: 2, occupancy: 170, demand: 120 }).success).toBe(false);
    const input = visitSchema.parse({ stationId: 2, occupancy: 9999, peopleOff: 30, peopleBoarding: 100, demand: 120 });
    expect(input).not.toHaveProperty("occupancy");
    expect(visitSchema.safeParse({ ...input, peopleBoarding: 0.5 }).success).toBe(false);
  });
});

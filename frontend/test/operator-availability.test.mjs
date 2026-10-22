import { afterEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { availableOperationBuses } from "../src/utils/operation-availability.ts";
import { tripAccessSummary } from "../src/utils/trip-access-summary.ts";

const resolver = registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL?.endsWith("/src/services/operations/operations.service.ts") && specifier.startsWith(".")) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}, load(url, context, nextLoad) {
  const result = nextLoad(url, context);
  return url.endsWith("/src/services/http.client.ts") ? { ...result, format: "module",
    source: stripTypeScriptTypes(String(result.source), { mode: "transform" }) } : result;
} });
const { getOperationsData, getFinalizedTrips } = await import("../src/services/operations/operations.service.ts");
resolver.deregister();
afterEach(() => mock.restoreAll());

const bus = id => ({ id_bus: id, codigo: `BUS-${String(id).padStart(3, "0")}`, capacidad_maxima: 250 });
const line = (id, stationIds, busIds) => ({ id_linea: id, codigo: `L${id}`, nombre: `Línea ${id}`,
  estaciones: stationIds.map((estacion_id, index) => ({ estacion_id, orden: index + 1,
    estacion: { id_estacion: estacion_id, nombre: estacion_id === 4 ? "San Rafael" : `Estación ${estacion_id}` } })),
  asignaciones_bus: busIds.map(id => ({ bus: bus(id) })),
});
const l6 = line(6, [5, 4, 6], [5, 6, 7]);
const l18 = line(18, [1, 2, 3, 4], [1, 2, 3, 4]);
const trip = (id, line, busId, state = "FINALIZADO") => ({ id_recorrido: String(id), estado: state,
  fecha_inicio: "2026-10-10T12:00:00Z", linea: { codigo: line.codigo, nombre: line.nombre }, bus: bus(busId), visitas: [] });
const respond = value => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });

describe("Disponibilidad del operador a partir del alcance autorizado por la API", () => {
  it("Dashboard y selector reciben L6 y tres buses, sin ampliar por San Rafael", async () => {
    const history = [trip(61, l6, 5)];
    const fetch = mock.method(globalThis, "fetch", async path => respond(path === "/api/operations/lines"
      ? { items: [l6] } : { items: path.includes("state=EN_CURSO") ? [] : history }));
    const data = await getOperationsData();
    assert.deepEqual(data.lines.map(line => line.codigo), ["L6"]);
    assert.deepEqual(availableOperationBuses(data.lines, data.openTrips).map(bus => bus.codigo), ["BUS-005", "BUS-006", "BUS-007"]);
    assert.equal(availableOperationBuses(data.lines, data.openTrips).length, 3);
    assert.deepEqual(data.trips.map(trip => trip.linea.codigo), ["L6"]);
    assert.ok(fetch.mock.calls.every(call => call.arguments[1].credentials === "include"));
  });
  it("ofrece únicamente buses de la línea seleccionada cuando hay dos líneas autorizadas", () => {
    assert.deepEqual(availableOperationBuses([l6], []).map(bus => bus.id_bus), [5, 6, 7]);
    assert.deepEqual(availableOperationBuses([l18], []).map(bus => bus.id_bus), [1, 2, 3, 4]);
    assert.equal(availableOperationBuses([l6, l18], []).length, 7);
  });
  it("excluye buses ocupados del selector y del Dashboard sin contar duplicados", () => {
    const open = trip(62, l6, 5, "EN_CURSO");
    assert.deepEqual(availableOperationBuses([l6, l6], [open]).map(bus => bus.id_bus), [6, 7]);
    assert.equal(availableOperationBuses([l18], [open]).length, 4);
    assert.equal(availableOperationBuses([l6], [trip(63, l6, 5, "CANCELADO")]).length, 3);
    assert.deepEqual(availableOperationBuses([], [open]), []);
  });
  it("conserva activos e historial del alcance que devuelve el endpoint autenticado", async () => {
    const open = trip(62, l6, 6, "EN_CURSO");
    mock.method(globalThis, "fetch", async path => respond(path === "/api/operations/lines" ? { items: [l6] }
      : { items: path.includes("state=EN_CURSO") ? [open] : [open, trip(61, l6, 5)] }));
    const data = await getOperationsData();
    assert.deepEqual(data.openTrips.map(trip => trip.id_recorrido), ["62"]);
    assert.deepEqual(data.trips.map(trip => trip.id_recorrido), ["62", "61"]);
  });
  it("el resumen carga todas las páginas de finalizados ya autorizados sin consultar un catálogo global", async () => {
    const fetch = mock.method(globalThis, "fetch", async path => {
      const page = new URL(path, "https://test.invalid").searchParams.get("page");
      return respond({ items: [trip(page === "1" ? 61 : 62, l6, 5)], total: 2 });
    });
    const finalized = await getFinalizedTrips();
    assert.deepEqual(finalized.map(trip => trip.linea.codigo), ["L6", "L6"]);
    assert.equal(fetch.mock.calls.length, 2);
    assert.ok(fetch.mock.calls.every(call => call.arguments[0].startsWith("/api/operations/trips?state=FINALIZADO")));
  });
  it("mantiene el cálculo de 330 accesos y Q330.00 del recorrido autorizado", () => {
    const finalized = { ...trip(61, l6, 5), visitas: [100, 140, 90].map((demanda, index) => ({
      id_visita: String(index + 1), orden: index + 1, ocupacion: 100, demanda,
      estacion: l6.estaciones[index].estacion, revenue: { accesses: demanda, medium: "Tarjeta Ciudadana", tariff: "1.00",
        estimatedRevenue: `${demanda}.00`, configurationIssue: null },
    })) };
    const snapshot = structuredClone(finalized);
    const result = tripAccessSummary(finalized);
    assert.equal(result.accesses, 330); assert.equal(result.referenceTotal, "330.00");
    assert.deepEqual(finalized, snapshot);
  });
});

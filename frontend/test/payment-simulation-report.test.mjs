import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { getReportTabs, reportKinds } from "../src/types/reports.types.ts";
import { tripAccessSummary } from "../src/utils/trip-access-summary.ts";

// Resolve the app's extensionless TypeScript dependencies in this Node-only test.
const resolver = registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL?.endsWith("/src/utils/payment-simulation-report.ts") && specifier.startsWith(".")) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
} });
const { paymentSimulationRows, paymentSimulationTotals, paymentSimulationLookups, revenueCsvRows, revenueCsvHeaders, paymentCurrency } = await import("../src/utils/payment-simulation-report.ts");
resolver.deregister();

const trip = (id, state = "FINALIZADO", date = "2026-10-10T12:00:00.000Z", lineId = 18, busId = 1, demands = [80, 375, 10]) => ({
  id_recorrido: id, estado: state, fecha_inicio: date,
  linea: { id_linea: lineId, codigo: `L${lineId}`, nombre: `Línea ${lineId}` },
  bus: { id_bus: busId, codigo: `BUS${busId}`, capacidad_maxima: 250 },
  visitas: demands.map((demanda, index) => ({ id_visita: `${id}-${index}`, orden: index + 1,
    demanda, ocupacion: 220, personas_bajan: 25, personas_abordan: 100, estacion: { nombre: `Estación ${index + 1}` },
    revenue: { accesses: demanda, medium: "Tarjeta Ciudadana", tariff: "1.00", estimatedRevenue: `${demanda}.00`, configurationIssue: null } })),
});

describe("Recaudación por recorrido administrativa", () => {
  it("sustituye los conteos y mantiene los reportes de visitas y flota, sin mapa", () => {
    const tabs = getReportTabs({ showNetwork: false, paymentSimulation: true });
    assert.deepEqual(tabs.map(tab => tab.id), ["operations", "payment-simulation", "fleet"]);
    assert.deepEqual(tabs.map(tab => tab.title), ["Visitas y demanda", "Recaudación por recorrido", "Historial de flota"]);
    assert.deepEqual(getReportTabs(), reportKinds);
  });
  it("usa el mismo resumen que el Operador y excluye activos y cancelados", () => {
    const finalized = trip("9007199254740993");
    const snapshot = structuredClone(finalized);
    const rows = paymentSimulationRows([trip(1, "EN_CURSO"), finalized, trip(3, "CANCELADO")]);
    const summary = tripAccessSummary(finalized);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, "9007199254740993");
    assert.equal(rows[0].reference, "#9007199254740993");
    assert.equal(rows[0].accesses, summary.accesses);
    assert.equal(rows[0].accesses, 465);
    assert.equal(rows[0].referenceTotal, "465.00");
    assert.equal(rows[0].medium, "Tarjeta Ciudadana");
    assert.equal(rows[0].stationsServed, 3);
    assert.deepEqual(rows[0].stations, summary.stations);
    assert.deepEqual(finalized, snapshot);
  });
  it("aplica fechas inclusivas en Guatemala y combina los filtros de línea y bus", () => {
    const source = [
      trip(1, "FINALIZADO", "2026-10-10T05:59:59.000Z", 18, 1),
      trip(2, "FINALIZADO", "2026-10-10T06:00:00.000Z", 18, 1),
      trip(3, "FINALIZADO", "2026-10-11T05:59:59.000Z", 18, 1),
      trip(4, "FINALIZADO", "2026-10-11T06:00:00.000Z", 18, 1),
      trip(5, "FINALIZADO", "2026-10-10T12:00:00.000Z", 19, 1),
      trip(6, "FINALIZADO", "2026-10-10T12:00:00.000Z", 18, 2),
    ];
    assert.deepEqual(paymentSimulationRows(source, { from: "2026-10-10", to: "2026-10-10", lineId: "18", busId: "1" })
      .map(row => row.id), ["2", "3"]);
    assert.equal(paymentSimulationRows(source, { from: "2026-10-12", to: "2026-10-11" }).length, 0);
    assert.equal(paymentSimulationRows(source, { from: "2026-10-11" }).length, 1);
    assert.equal(paymentSimulationRows(source, { to: "2026-10-09" }).length, 1);
  });
  it("ofrece líneas y buses del histórico consultado, sin duplicados ni dependencias de catálogos activos", () => {
    const lookups = paymentSimulationLookups([trip(1), trip(2), trip(3, "FINALIZADO", undefined, 19, 2), trip(4, "EN_CURSO", undefined, 20, 3)]);
    assert.deepEqual(lookups.lineId.map(line => line.id_linea), [18, 19]);
    assert.deepEqual(lookups.busId.map(bus => bus.id_bus), [1, 2]);
  });
  it("agrega únicamente las filas consultadas y conserva ceros y recorridos sin visitas", () => {
    const rows = paymentSimulationRows([trip(1), trip(2, "FINALIZADO", undefined, 19, 2, [0]), trip(3, "FINALIZADO", undefined, 19, 2, [])]);
    assert.deepEqual(paymentSimulationTotals(rows), { trips: 3, accesses: 465, referenceTotal: "465.00", missingPayments: 0 });
    assert.deepEqual(paymentSimulationTotals(paymentSimulationRows([trip(1)], { lineId: "19" })), { trips: 0, accesses: 0, referenceTotal: "0.00", missingPayments: 0 });
    assert.equal(rows[1].referenceTotal, "0.00");
    assert.equal(rows[2].stationsServed, 0);
    assert.deepEqual(rows[2].stations, []);
  });
  it("conserva tarifas diferentes, marca faltantes y exporta los datos por estación sin inventarlos", () => {
    const source = trip(1);
    source.visitas[0].revenue = { accesses: 80, medium: "Tarjeta", tariff: "2.50", estimatedRevenue: "200.00", configurationIssue: null };
    source.visitas[1].revenue = { accesses: 375, medium: "Efectivo", tariff: "3.00", estimatedRevenue: "1125.00", configurationIssue: null };
    source.visitas[2].revenue = { accesses: 10, medium: null, tariff: null, estimatedRevenue: null, configurationIssue: "Sin medio de pago principal" };
    const rows = paymentSimulationRows([source]);
    assert.equal(rows[0].referenceTotal, "1325.00"); assert.equal(rows[0].missingPayments, 1);
    assert.equal(rows[0].accesses, 465);
    const csv = revenueCsvRows(rows);
    assert.equal(csv.length, 3); assert.ok(csv.every(row => row.length === revenueCsvHeaders.length));
    assert.deepEqual(csv[0].slice(5, 9), [80, "Tarjeta", "2.50", "200.00"]);
    assert.deepEqual(csv[2].slice(5, 9), [10, "Sin medio de pago principal", "", ""]);
  });
  it("deja el total sin calcular cuando falta toda la configuración de pagos", () => {
    const source = trip(1); source.visitas.forEach(visit => delete visit.revenue);
    const rows = paymentSimulationRows([source]);
    assert.equal(rows[0].referenceTotal, null); assert.equal(rows[0].missingPayments, 3);
    assert.equal(paymentSimulationTotals(rows).referenceTotal, null);
    assert.equal(rows[0].medium, "Sin medio de pago principal");
  });
  it("mantiene centavos al acumular y presentar importes mayores que el entero seguro de JavaScript", () => {
    const source = trip(1, "FINALIZADO", undefined, 18, 1, [1, 1]);
    source.visitas[0].revenue.estimatedRevenue = "9007199254740993.01";
    source.visitas[1].revenue.estimatedRevenue = "0.09";
    assert.equal(paymentSimulationRows([source])[0].referenceTotal, "9007199254740993.10");
    assert.ok(paymentCurrency("9007199254740993.10").endsWith(".10"));
    assert.equal(paymentCurrency(null), "Sin calcular");
  });
});

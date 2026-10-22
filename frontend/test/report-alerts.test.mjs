import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { operationAlertCounts } from "../src/utils/report-alerts.ts";

describe("Alertas detectadas en Operación registrada", () => {
  it("suma ambas categorías y cuenta dos alertas si coinciden en el mismo registro", () => {
    const visits = [
      { unidadAdicional: true, esperaMinutos: 5 },
      { unidadAdicional: true, esperaMinutos: 0 },
      { unidadAdicional: false, esperaMinutos: 5 },
      { unidadAdicional: false, esperaMinutos: 0 },
    ];
    const summary = {
      extraUnitAlerts: visits.filter(visit => visit.unidadAdicional === true).length,
      additionalWaitVisits: visits.filter(visit => visit.esperaMinutos > 0).length,
    };
    assert.deepEqual(operationAlertCounts(summary), { unitAlerts: 2, waitAlerts: 2, total: 4 });
  });
  it("conserva consultas con una sola categoría y cuenta visitas con espera, no minutos", () => {
    assert.deepEqual(operationAlertCounts({ extraUnitAlerts: 2, additionalWaitVisits: 0 }),
      { unitAlerts: 2, waitAlerts: 0, total: 2 });
    assert.deepEqual(operationAlertCounts({ extraUnitAlerts: 0, additionalWaitVisits: 1 }),
      { unitAlerts: 0, waitAlerts: 1, total: 1 });
  });
  it("mantiene los totales completos aunque la tabla esté truncada y no altera el resumen", () => {
    const summary = { visits: 1500, extraUnitAlerts: 1300, additionalWaitVisits: 1200 };
    const original = structuredClone(summary);
    assert.deepEqual(operationAlertCounts(summary), { unitAlerts: 1300, waitAlerts: 1200, total: 2500 });
    assert.deepEqual(summary, original);
  });
  it("muestra cero mientras no existe un resumen y suma contadores numéricos serializados", () => {
    assert.deepEqual(operationAlertCounts({}), { unitAlerts: 0, waitAlerts: 0, total: 0 });
    assert.equal(operationAlertCounts({ extraUnitAlerts: "2", additionalWaitVisits: "2" }).total, 4);
  });
});

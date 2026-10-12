import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { arrivingPeople, hasPassengerMovements, previewVisit } from "../src/utils/visit-passengers.ts";
import { tripAccessSummary } from "../src/utils/trip-access-summary.ts";

describe("Vista previa y continuidad persistida", () => {
  it("calcula la ocupación y valida bajadas, abordaje y capacidad", () => {
    assert.equal(previewVisit(250, 100, "30", "100", "120").occupancy, 170);
    assert.match(previewVisit(250, 100, "101", "0", "0").error, /No pueden bajar/);
    assert.match(previewVisit(250, 100, "0", "51", "50").error, /No pueden abordar/);
    assert.match(previewVisit(250, 200, "0", "60", "60").error, /capacidad máxima/);
  });
  it("no evalúa campos incompletos, negativos, fraccionarios o capacidad cero", () => {
    for (const args of [[250,0,"","0","0"],[250,0,"0","-1","0"],[250,0,"0","0.5","1"],[0,0,"0","0","0"]]) {
      assert.equal(previewVisit(...args).ready, false);
    }
  });
  it("recupera la última ocupación por orden sin inventar movimientos históricos", () => {
    assert.equal(arrivingPeople([]), 0);
    const visits = [{orden:2,ocupacion:220}, {orden:1,ocupacion:100}];
    assert.equal(arrivingPeople(JSON.parse(JSON.stringify(visits))), 220);
    assert.equal(hasPassengerMovements({personas_bajan:null,personas_abordan:null}), false);
    assert.equal(hasPassengerMovements({personas_bajan:0,personas_abordan:0}), true);
  });
  it("mantiene los límites de alerta y espera", () => {
    assert.equal(previewVisit(250,100,"50","0","375").requiresSupportUnit, true);
    assert.equal(previewVisit(250,100,"50","0","375").requiresExtraWait, true);
    assert.equal(previewVisit(100,25,"0","0","149").requiresSupportUnit, false);
    assert.equal(previewVisit(100,25,"0","0","149").requiresExtraWait, false);
  });
});

describe("Accesos y recaudación referencial", () => {
  const visits = [80,375,10].map((demanda,index) => ({ id_visita:String(index+1),orden:index+1,demanda,ocupacion:220,estacion:{nombre:`Estación ${index+1}`},
    revenue: { accesses: demanda, medium: "Tarjeta Ciudadana", tariff: "1.00", estimatedRevenue: `${demanda}.00`, configurationIssue: null } }));
  it("suma 465 accesos y Q465.00 sin contar pasajeros dentro del bus", () => {
    const result=tripAccessSummary({estado:"FINALIZADO",visitas:visits});
    assert.equal(result.accesses,465); assert.equal(result.referenceTotal,"465.00"); assert.equal(result.stationsServed,3);
    assert.deepEqual(result.stations.map(s=>s.accesses),[80,375,10]);
  });
  it("excluye recorridos activos y cancelados", () => {
    for (const estado of ["EN_CURSO","CANCELADO"]) assert.equal(tripAccessSummary({estado,visitas:visits}),null);
  });
  it("admite histórico y recorridos sin visitas sin inventar ingresos", () => {
    assert.equal(tripAccessSummary({estado:"FINALIZADO",visitas:[]}).accesses,0);
    const configured = visits.map(visit => ({ ...visit, revenue: { ...visit.revenue, tariff: "2.00", estimatedRevenue: `${visit.demanda * 2}.00` } }));
    assert.equal(tripAccessSummary({estado:"FINALIZADO",visitas:configured}).referenceTotal,"930.00");
  });
});

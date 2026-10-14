import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { monitoringSnapshot, monitoringTrips, monitoringSummary } from "../src/utils/operational-monitoring.ts";
import { getPanelsByRole } from "./support/role-routing.mjs";

const station = (id, order) => ({ estacion_id:id, orden:order, estacion:{ nombre:`Estación ${id}` } });
const line = { codigo:"LINE-TEST", estaciones:[station(3,3),station(1,1),station(2,2)] };
const visit = (order, occupancy, waiting, support=false, wait=0) => ({
  id_visita:String(order),orden:order,ocupacion:occupancy,demanda:waiting,
  estacion:{nombre:`Estación ${order}`},alerta_unidad_adicional:support,espera_adicional_minutos:wait,
});
const trip = (state="EN_CURSO", visits=[]) => ({ id_recorrido:1,estado:state,linea:{codigo:line.codigo},visitas:visits });

describe("Seguimiento operativo de solo consulta", () => {
  it("no inventa mediciones ni alertas antes de la primera visita", () => {
    const snapshot=monitoringSnapshot(trip(),[line]);
    assert.equal(snapshot.occupancy,null); assert.equal(snapshot.waiting,null);
    assert.equal(snapshot.lastVisit,undefined); assert.equal(snapshot.lastStation,"Sin visitas registradas");
    assert.equal(snapshot.nextStation,"Estación 1"); assert.equal(snapshot.visits,"0 de 3");
  });
  it("usa la última visita por secuencia y la próxima parada de la línea ordenada", () => {
    const latest=visit(2,220,375,true,0), first=visit(1,100,100);
    const visits=[latest,first];
    const snapshot=monitoringSnapshot(trip("EN_CURSO",visits),[line]);
    assert.equal(snapshot.lastVisit,latest); assert.equal(snapshot.occupancy,220); assert.equal(snapshot.waiting,375);
    assert.equal(snapshot.nextStation,"Estación 3"); assert.equal(snapshot.lastStation,"Estación 2");
    assert.equal(snapshot.lastVisit.alerta_unidad_adicional,true);
    assert.equal(visits[0],latest); assert.equal(line.estaciones[0].orden,3);
  });
  it("conserva cero cuando sí existe una medición real y admite visitas históricas", () => {
    const snapshot=monitoringSnapshot(trip("EN_CURSO",[visit(1,0,0)]),[line]);
    assert.equal(snapshot.occupancy,0); assert.equal(snapshot.waiting,0);
  });
  it("distingue una ruta agotada de información de estaciones no disponible", () => {
    const finished=trip("EN_CURSO",[visit(1,100,80),visit(2,210,375),visit(3,50,10)]);
    assert.equal(monitoringSnapshot(finished,[line]).nextStation,"Recorrido listo para finalizar");
    assert.equal(monitoringSnapshot(trip(),[]).nextStation,"No disponible");
    assert.equal(monitoringSnapshot({...trip(),linea:{codigo:line.codigo,estaciones:line.estaciones}},[]).nextStation,"Estación 1");
  });
  it("separa activos de finalizados y cancelados sin mezclar los estados", () => {
    const states=[trip(),trip("FINALIZADO"),trip("CANCELADO")];
    assert.deepEqual(monitoringTrips(states,"active").map(t=>t.estado),["EN_CURSO"]);
    assert.deepEqual(monitoringTrips(states,"history").map(t=>t.estado),["FINALIZADO","CANCELADO"]);
  });
  it("cuenta indicadores de datos cargados y utiliza alertas de la API sin recalcular umbrales", () => {
    const states=[trip("EN_CURSO",[visit(1,100,0,true,5)]),trip("FINALIZADO",[visit(1,0,10000,false,0)]),trip("CANCELADO")];
    assert.deepEqual(monitoringSummary(states),{active:1,finalized:1,visits:2,alerts:1});
    assert.deepEqual(monitoringSummary([]),{active:0,finalized:0,visits:0,alerts:0});
  });
  it("mueve únicamente la entrada administrativa y conserva su URL", () => {
    const admin=getPanelsByRole("ADMIN");
    assert.deepEqual(admin.filter(p=>p.group==="Configuración operativa").map(p=>p.id),["transport","fleet"]);
    assert.deepEqual(admin.filter(p=>p.group==="Información y control").map(p=>p.title),["Seguimiento operativo","Consultas y reportes","Bitácora"]);
    assert.equal(admin.find(p=>p.id==="operations").path,"/admin/operations");
    assert.equal(getPanelsByRole("OPERADOR_ESTACION").find(p=>p.id==="operations").title,"Recorridos");
    assert.equal(getPanelsByRole("OPERADOR_ESTACION").find(p=>p.id==="operations").path,"/operador/operations");
  });
  it("no monta formularios ni acciones de escritura en el árbol administrativo", () => {
    for (const path of ["../src/pages/admin/OperationsPage.tsx","../src/components/operations/OperationalMonitoringTable.tsx","../src/hooks/operations/useOperationalMonitoring.ts"]) {
      const source=readFileSync(new URL(path,import.meta.url),"utf8");
      assert.doesNotMatch(source,/\b(?:OperationsWorkspace|TripStartForm|VisitForm|CancelTripDialog|createTrip|createVisit|closeTrip|onCancel)\b/);
    }
    const service=readFileSync(new URL("../src/services/operations/monitoring.service.ts",import.meta.url),"utf8");
    assert.match(service,/method: "GET"/); assert.doesNotMatch(service,/"(?:POST|PUT|PATCH|DELETE)"/);
  });
});

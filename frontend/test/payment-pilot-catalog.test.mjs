import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resourcesBySection } from "../src/config/catalog/resources.ts";
import { personnelView, securityAccessView, fleetView, contextFormResource } from "../src/config/catalog/administration.ts";
import { catalogRelationAvailable } from "../src/config/catalog/relations.ts";
const resources = Object.values(resourcesBySection).flat();

describe("Medios de pago y asignaciones contextuales", () => {
  it("mantiene las entidades de seguridad y añade tarifa monetaria y estado al mismo CRUD", () => {
    assert.deepEqual(securityAccessView.resourceKeys, ["guards", "accesses", "media"]);
    const medium = resources.find(resource => resource.key === "media");
    assert.equal(medium.title, "Medios de pago");
    assert.equal(medium.path, "/api/access-media/media");
    assert.deepEqual(medium.fields.map(field => field.name), ["name", "description", "tariff", "active"]);
    const tariff = medium.fields.find(field => field.name === "tariff");
    assert.equal(tariff.step, "0.01"); assert.equal(tariff.min, 0.01); assert.equal(tariff.required, true);
    const principal = resources.find(resource => resource.key === "station-media").fields.find(field => field.name === "isPrincipal");
    assert.deepEqual(principal.options.map(option => option.value), ["true", "false"]);
  });
  it("preselecciona el piloto y reutiliza el formulario temporal con fecha de inicio", () => {
    const action = personnelView.rowActions.pilots[0]; const form = contextFormResource(action, resources);
    assert.equal(action.label({ asignaciones_bus: [] }), "Asignar bus");
    assert.equal(action.label({ asignaciones_bus: [{ bus_id: 1 }] }), "Reasignar bus");
    const values = { ...action.valuesFromRow({ id_piloto: 7 }), busId: "12", startDate: "2026-10-10T12:00" };
    assert.equal(form.method, "PUT"); assert.equal(form.writePath(values), "/api/personnel/pilots/7/bus");
    assert.equal(form.body(values).busId, 12); assert.ok(form.body(values).startDate.endsWith("Z"));
    assert.deepEqual(form.body({ pilotId: "7", busId: "12" }), { busId: 12 });
    assert.deepEqual(personnelView.resourceKeys, ["pilots", "operators"]);
  });
  it("añade reemplazo del piloto dentro de Buses sin crear una pestaña de asignación de piloto", () => {
    assert.deepEqual(fleetView.resourceKeys, resourcesBySection.fleet.map(resource => resource.key));
    assert.ok(!fleetView.resourceKeys.includes("bus-pilot"));
    const action = fleetView.rowActions.buses[0]; const form = contextFormResource(action, resources);
    assert.equal(action.label({ asignaciones_piloto: [{ piloto_id: 1 }] }), "Reasignar piloto");
    assert.equal(form.writePath(action.valuesFromRow({ id_bus: 12 })), "/api/fleet/buses/12/pilot");
    assert.deepEqual(form.body({ busId: "12", pilotId: "7" }), { pilotId: 7 });
  });
  it("excluye buses y pilotos ocupados o inactivos y marca buses sin piloto para asignación de línea", () => {
    const freeBus = { activo: true, asignaciones_piloto: [] };
    const occupiedBus = { activo: true, asignaciones_piloto: [{ piloto_id: 7 }] };
    assert.equal(catalogRelationAvailable("pilot-bus", "busId", freeBus, { pilotId: "8" }), true);
    assert.equal(catalogRelationAvailable("pilot-bus", "busId", occupiedBus, { pilotId: "8" }), false);
    assert.equal(catalogRelationAvailable("pilot-bus", "busId", occupiedBus, { pilotId: "7" }), true);
    assert.equal(catalogRelationAvailable("bus-pilot", "pilotId", { activo: true, asignaciones_bus: [{ bus_id: 1 }] }, {}), false);
    assert.equal(catalogRelationAvailable("bus-pilot", "pilotId", { activo: false, asignaciones_bus: [] }, {}), false);
    assert.equal(catalogRelationAvailable("assign-line", "busId", freeBus, {}), false);
    assert.equal(catalogRelationAvailable("assign-line", "busId", freeBus, { lineId: "0" }), true);
    assert.equal(catalogRelationAvailable("assign-line", "busId", occupiedBus, {}), true);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { transportView, transportLineViewTab } from "../src/config/catalog/transport.ts";
import { contextFormResource } from "../src/config/catalog/administration.ts";
import { resourcesBySection } from "../src/config/catalog/resources.ts";
import { transportNetworkLines } from "../src/utils/transport-line-view.ts";

const resources = resourcesBySection.transport;
const membership = (id, order, distance) => ({
  estacion_id: id, orden: order, distancia_siguiente: distance,
  estacion: { id_estacion: id, codigo: `E${id}`, nombre: `Estación ${id}` },
});
const line = (id, active, stops, total) => ({
  id_linea: id, codigo: `L${id}`, nombre: `Línea ${id}`, activo: active,
  municipalidad: { nombre: "Municipalidad de Guatemala" }, estaciones: stops, distanciaTotal: total,
});

describe("Red de transporte del Administrador", () => {
  it("ofrece las cuatro pestañas principales y mantiene alcanzables las acciones internas", () => {
    const tabs = [...transportView.resourceKeys.map(key => resources.find(resource => resource.key === key).title),
      transportLineViewTab.title];
    assert.deepEqual(tabs, ["Municipalidades", "Líneas", "Estaciones", "Vista de líneas"]);
    const reachable = new Set([...transportView.resourceKeys, ...transportView.rowActions.lines.map(action => action.resourceKey)]);
    assert.ok(resources.every(resource => reachable.has(resource.key)));
    assert.equal(transportView.inactiveLabels.lines, "En preparación");
  });
  it("conserva los campos y endpoints de creación de las tres entidades", () => {
    for (const [key, path, fields] of [
      ["municipalities", "/api/transport/municipalities", ["name"]],
      ["lines", "/api/transport/lines", ["code", "name", "municipalityId"]],
      ["stations", "/api/transport/stations", ["code", "name", "municipalityId"]],
    ]) {
      const resource = resources.find(item => item.key === key);
      assert.equal(resource.method, "POST"); assert.equal(resource.path, path);
      assert.deepEqual(resource.fields.map(field => field.name), fields);
      assert.ok(resource.fields.every(field => field.required));
    }
  });
  it("preselecciona la línea y mantiene el contrato de asociaciones y distancias", () => {
    const action = transportView.rowActions.lines.find(item => item.resourceKey === "line-stations");
    const form = contextFormResource(action, resources);
    const values = action.valuesFromRow({ id_linea: 18 });
    assert.deepEqual(values, { lineId: "18" });
    assert.equal(form.method, "PUT");
    assert.equal(form.writePath(values), "/api/transport/lines/18/stations");
    const stations = [{ stationId: 1, order: 1, distanceToNext: 1 }, { stationId: 2, order: 2, distanceToNext: null }];
    assert.deepEqual(form.body({ ...values, stations: JSON.stringify(stations) }), { stations });
  });
  it("propone activar o desactivar mediante el recurso original, conservando sus opciones", () => {
    const action = transportView.rowActions.lines.find(item => item.resourceKey === "activate-line");
    const form = contextFormResource(action, resources);
    assert.equal(action.label({ activo: false }), "Activar");
    assert.equal(action.label({ activo: true }), "Desactivar");
    assert.deepEqual(action.valuesFromRow({ id_linea: 18, activo: false }), { lineId: "18", active: "true" });
    assert.deepEqual(action.valuesFromRow({ id_linea: 18, activo: true }), { lineId: "18", active: "false" });
    assert.equal(form.method, "PATCH");
    assert.equal(form.writePath({ lineId: "18" }), "/api/transport/lines/18");
    assert.deepEqual(form.fields.find(field => field.name === "active").options.map(option => option.value), ["true", "false"]);
  });
  it("muestra líneas en preparación y vacías, sin exigir activarlas para consultar el esquema", () => {
    const result = transportNetworkLines([line(18, false, [], 0), line(19, true, [membership(1, 1, null)], 0)]);
    assert.equal(result.length, 2);
    assert.equal(result[0].code, "L18"); assert.deepEqual(result[0].stations, []);
    assert.equal(result[0].totalDistance, 0);
    assert.equal(result[1].stations[0].distanceToNext, null);
    assert.equal(result[0].municipality, "Municipalidad de Guatemala");
  });
  it("ordena el esquema sin alterar el catálogo y conserva el total enviado por el backend", () => {
    const source = [line(18, false, [membership(3, 3, null), membership(1, 1, "1.000"), membership(2, 2, "1.000")], 2)];
    const snapshot = structuredClone(source);
    const result = transportNetworkLines(source);
    assert.deepEqual(result[0].stations.map(stop => stop.id), [1, 2, 3]);
    assert.deepEqual(result[0].stations.map(stop => stop.distanceToNext), [1, 1, null]);
    assert.equal(result[0].totalDistance, 2);
    assert.deepEqual(source, snapshot);
    // An authoritative total must survive even if a fixture's segments differ.
    assert.equal(transportNetworkLines([line(18, false, source[0].estaciones, 9.75)])[0].totalDistance, 9.75);
    assert.equal(transportNetworkLines([line(18, false, [membership(1, 1, null), membership(2, 2, null)], null)])[0].totalDistance, null);
  });
  it("conserva conexiones entre líneas que comparten estaciones, sin enlazar una línea consigo misma", () => {
    const result = transportNetworkLines([
      line(18, false, [membership(1, 1, 1), membership(2, 2, null)], 1),
      line(19, true, [membership(2, 1, 1), membership(3, 2, null)], 1),
      line(20, false, [membership(4, 1, null)], 0),
    ]);
    assert.deepEqual(result[0].stations[0].sharedLineIds, []);
    assert.deepEqual(result[0].stations[1].sharedLineIds, [19]);
    assert.deepEqual(result[1].stations[0].sharedLineIds, [18]);
    assert.deepEqual(result[2].stations[0].sharedLineIds, []);
  });
});

import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { catalogFormFields } from "../src/config/catalog/form-fields.ts";
import { resourcesBySection } from "../src/config/catalog/resources.ts";

const resolver = registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL?.endsWith("/src/services/catalog/catalog.service.ts") && specifier.startsWith(".")) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}, load(url, context, nextLoad) {
  const result = nextLoad(url, context);
  // The existing ApiError uses parameter properties, which need Node's transform mode.
  return url.endsWith("/src/services/http.client.ts") ? { ...result, format: "module",
    source: stripTypeScriptTypes(String(result.source), { mode: "transform" }) } : result;
} });
const { endAccessGuardAssignment } = await import("../src/services/catalog/catalog.service.ts");
resolver.deregister();
afterEach(() => mock.restoreAll());
const access = resourcesBySection.personnel.find(resource => resource.key === "accesses");

describe("Corrección de accesos desde el catálogo", () => {
  it("permite seleccionar estación al crear y editar un acceso inactivo", () => {
    assert.ok(catalogFormFields(access, null).some(field => field.name === "stationId"));
    const fields = catalogFormFields(access, { activo: false, estacion_id: 2 });
    assert.ok(fields.some(field => field.name === "stationId"));
    assert.equal(fields.filter(field => field.name === "active").length, 1);
  });
  it("oculta el cambio de estación al editar accesos activos", () => {
    assert.equal(catalogFormFields(access, { activo: true }).some(field => field.name === "stationId"), false);
    assert.ok(catalogFormFields(access, { activo: true }).some(field => field.name === "name"));
  });
  it("conserva las restricciones de edición de los demás catálogos y sus configuraciones originales", () => {
    const fields = [{ name: "stationId", label: "Estación" }, { name: "parkingId", label: "Parqueo" },
      { name: "code", label: "Código" }, { name: "name", label: "Nombre" }];
    const resource = { key: "stations", fields };
    assert.deepEqual(catalogFormFields(resource, { activo: false }).map(field => field.name), ["name", "active"]);
    assert.deepEqual(resource.fields, fields);
    assert.deepEqual(catalogFormFields(resource, null), fields);
  });
  it("reutiliza el endpoint de finalización de asignación sin enviar una eliminación de guardia", async () => {
    const fetch = mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ item: { fecha_fin: "2026-10-15" } })));
    await endAccessGuardAssignment(31);
    assert.equal(fetch.mock.calls.length, 1);
    const [path, options] = fetch.mock.calls[0].arguments;
    assert.equal(path, "/api/security/guard-assignments/31");
    assert.equal(options.method, "DELETE"); assert.equal(options.credentials, "include");
    assert.equal(options.body, undefined);
  });
});

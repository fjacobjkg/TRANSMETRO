import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { personnelView, securityAccessView, contextFormResource } from "../src/config/catalog/administration.ts";
import { resourcesBySection } from "../src/config/catalog/resources.ts";
import { getPanelsByRole } from "./support/role-routing.mjs";

const resources = Object.values(resourcesBySection).flat();
const actions = view => Object.values(view.rowActions).flat();

describe("Reorganización de Personal y Seguridad y accesos", () => {
  it("expone únicamente entidades como pestañas y conserva todos los recursos originales", () => {
    assert.deepEqual(personnelView.resourceKeys, ["pilots", "operators"]);
    assert.deepEqual(securityAccessView.resourceKeys, ["guards", "accesses", "media"]);
    assert.equal(resourcesBySection.personnel.length, 9);
    const reachable = new Set([...personnelView.resourceKeys, ...securityAccessView.resourceKeys,
      ...actions(personnelView).map(a => a.resourceKey), ...actions(securityAccessView).map(a => a.resourceKey)]);
    assert.ok(resourcesBySection.personnel.every(resource => reachable.has(resource.key)));
  });
  it("preselecciona el operador y conserva el endpoint de asignación", () => {
    const action = personnelView.rowActions.operators[0];
    const values = action.valuesFromRow({ id_usuario: 42 });
    const form = contextFormResource(action, resources);
    assert.equal(form.method, "POST");
    assert.equal(form.writePath(values), "/api/personnel/operators/42/stations");
    assert.ok(form.fields.some(field => field.name === "stationId" && field.required));
    assert.deepEqual(values, { userId: "42" });
  });
  it("preselecciona el guardia y mantiene la asignación mediante el acceso seleccionado", () => {
    const action = securityAccessView.rowActions.guards[0];
    const form = contextFormResource(action, resources);
    assert.equal(form.method, "POST");
    assert.equal(form.writePath({ ...action.valuesFromRow({ id_guardia: 7 }), accessId: "19" }), "/api/security/accesses/19/guards");
    assert.deepEqual(action.valuesFromRow({ id_guardia: 7 }), { guardId: "7" });
  });
  it("propone habilitar o deshabilitar el acceso sin sustituir sus validaciones", () => {
    const action = securityAccessView.rowActions.accesses[0];
    const form = contextFormResource(action, resources);
    assert.equal(form.method, "PATCH");
    assert.equal(action.label({ activo: false }), "Habilitar");
    assert.equal(action.label({ activo: true }), "Deshabilitar");
    const values = action.valuesFromRow({ id_acceso: 8, activo: true });
    assert.deepEqual(values, { accessId: "8", active: "false" });
    assert.equal(form.writePath(values), "/api/security/accesses/8");
  });
  it("habilita medios mediante el formulario existente y conserva la opción de deshabilitar", () => {
    const action = securityAccessView.rowActions.media[0];
    const form = contextFormResource(action, resources);
    assert.equal(form.method, "PUT");
    assert.deepEqual(action.valuesFromRow({ id_medio_acceso: 6 }), { mediaId: "6" });
    assert.equal(form.writePath({ stationId: "15" }), "/api/access-media/stations/15/media");
    assert.deepEqual(form.fields.find(field => field.name === "active").options.map(option => option.value), ["true", "false"]);
  });
  it("reutiliza la creación de cuentas para operadores sin cambiar el recurso de Cuentas y permisos", () => {
    const action = personnelView.createActions.operators;
    const form = contextFormResource(action, resources);
    const original = resourcesBySection.users[0];
    assert.equal(form.key, "users"); assert.equal(form.path, original.path); assert.equal(form.method, original.method);
    assert.deepEqual(action.initialValues, { role: "OPERADOR_ESTACION" });
    assert.deepEqual(form.fields.find(field => field.name === "role").options.map(option => option.value), ["OPERADOR_ESTACION"]);
    assert.equal(original.fields.find(field => field.name === "role").options.length, 3);
    assert.equal(form.fields.find(field => field.name === "password").minLength, 12);
  });
  it("mantiene los contratos originales de todas las acciones contextuales", () => {
    for (const action of [...actions(personnelView), ...actions(securityAccessView)]) {
      const source = resources.find(resource => resource.key === action.resourceKey);
      const form = contextFormResource(action, resources);
      assert.equal(form.method, source.method); assert.equal(form.writePath, source.writePath);
      assert.deepEqual(form.fields, source.fields);
    }
    assert.equal(contextFormResource({ resourceKey: "missing", label: "No disponible" }, resources), undefined);
  });
  it("cambia solo la navegación del administrador", () => {
    const admin = getPanelsByRole("ADMIN");
    assert.equal(admin.find(p => p.id === "personnel").title, "Personal");
    assert.equal(admin.find(p => p.id === "personnel").path, "/admin/personnel");
    assert.equal(admin.find(p => p.id === "security-access").path, "/admin/security-access");
    assert.equal(admin.find(p => p.id === "security-access").group, "Administración");
    assert.deepEqual(getPanelsByRole("ADMINISTRATIVO", { administrativeRole: true }).map(p => p.id), ["home", "transport", "personnel", "fleet", "reports"]);
    assert.deepEqual(getPanelsByRole("OPERADOR_ESTACION").map(p => p.id), ["home", "operations", "access-counts"]);
  });
});

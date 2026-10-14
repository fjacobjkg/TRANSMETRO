import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FEATURES, isFrontendRoleEnabled, enabledRoleOptions, enabledCatalogRows, catalogPageMessage } from "../src/config/features.ts";
import { resourcesBySection } from "../src/config/catalog/resources.ts";
import { getPanelsByRole, getHomeRouteByRole, roleLabel } from "./support/role-routing.mjs";
import { readFileSync } from "node:fs";

describe("Desactivación temporal del rol Administrativo en frontend", () => {
  it("deshabilita únicamente Administrativo y conserva Admin y Operador", () => {
    assert.equal(FEATURES.administrativeRole, false);
    assert.equal(isFrontendRoleEnabled("ADMINISTRATIVO"), false);
    assert.equal(isFrontendRoleEnabled("ADMIN"), true);
    assert.equal(isFrontendRoleEnabled("OPERADOR_ESTACION"), true);
  });
  it("filtra los selectores de crear y cambiar cuenta sin eliminar opciones originales", () => {
    for (const key of ["users", "update-user"]) {
      const source = resourcesBySection.users.find(resource => resource.key === key).fields.find(field => field.name === "role").options;
      const snapshot = structuredClone(source);
      assert.ok(source.some(option => option.value === "ADMINISTRATIVO"));
      assert.deepEqual(enabledRoleOptions(source).filter(option => option.value).map(option => option.value), ["ADMIN", "OPERADOR_ESTACION"]);
      assert.deepEqual(source, snapshot);
      assert.deepEqual(enabledRoleOptions(source, { administrativeRole: true }), source);
    }
  });
  it("oculta cuentas en ambas tablas y sus contadores sin alterar la respuesta del API", () => {
    const response = { items: [
      { id_usuario: 1, nombre_usuario: "admin", rol: { nombre: "ADMIN" } },
      { id_usuario: 2, nombre_usuario: "operador", rol: { nombre: "OPERADOR_ESTACION" } },
      { id_usuario: 3, nombre_usuario: "consulta", rol: { nombre: "ADMINISTRATIVO" } },
    ], total: 3 };
    const snapshot = structuredClone(response);
    for (const key of ["users", "update-user"]) {
      const visible = enabledCatalogRows(key, response.items);
      assert.deepEqual(visible.map(row => row.nombre_usuario), ["admin", "operador"]);
      assert.equal(visible.length, 2);
      assert.deepEqual(enabledCatalogRows(key, response.items, { administrativeRole: true }), response.items);
    }
    assert.deepEqual(response, snapshot);
  });
  it("oculta el catálogo visible de roles y lo recupera al habilitar el flag", () => {
    const roles = [
      { id_rol: 1, nombre: "ADMIN", activo: true },
      { id_rol: 2, nombre: "OPERADOR_ESTACION", activo: true },
      { id_rol: 3, nombre: "ADMINISTRATIVO", activo: true },
    ];
    const snapshot = structuredClone(roles);
    assert.deepEqual(enabledCatalogRows("roles", roles).map(row => row.nombre), ["ADMIN", "OPERADOR_ESTACION"]);
    assert.deepEqual(enabledCatalogRows("roles", roles, { administrativeRole: true }), roles);
    assert.deepEqual(roles, snapshot);
  });
  it("filtra usuarios de los selects de relaciones y admite nombres de rol del API y de la UI", () => {
    const rows = [
      { id_usuario: 1, role: "ADMIN" },
      { id_usuario: 2, rol: "OPERADOR_ESTACION" },
      { id_usuario: 3, role: "ADMINISTRATIVO" },
      { id_usuario: 4, rol: { nombre: "Administrativo" } },
      { id_usuario: 5, role: { name: " administrativo " } },
    ];
    assert.deepEqual(enabledCatalogRows("users", rows).map(row => row.id_usuario), [1, 2]);
    assert.deepEqual(enabledCatalogRows("users", rows, { administrativeRole: true }), rows);
    assert.equal(isFrontendRoleEnabled("Administrativo"), false);
    assert.equal(isFrontendRoleEnabled("ADMINISTRATIVO", { administrativeRole: true }), true);
  });
  it("no muestra el rol en opciones de filtros ni elimina la opción sin filtro", () => {
    const filters = [
      { label: "Todos los roles", value: "" },
      { label: "Administrador", value: "ADMIN" },
      { label: "Operador", value: "OPERADOR_ESTACION" },
      { label: "Administrativo", value: "ADMINISTRATIVO" },
    ];
    assert.deepEqual(enabledRoleOptions(filters).map(option => option.label), ["Todos los roles", "Administrador", "Operador"]);
    assert.deepEqual(enabledRoleOptions(filters, { administrativeRole: true }), filters);
  });
  it("oculta menciones históricas del rol en bitácora y permite recuperarlas", () => {
    const rows = [
      { id_bitacora: 1, descripcion: "Se creó la cuenta consulta con rol ADMINISTRATIVO." },
      { id_bitacora: 2, descripcion: "Cambió el rol de Administrativo a ADMIN." },
      { id_bitacora: 3, descripcion: "Se creó la cuenta operador con rol OPERADOR_ESTACION." },
      { id_bitacora: 4, descripcion: "Se actualizó la administración de líneas." },
      { id_bitacora: 5, descripcion: "Consulta de flota", usuario: { rol: { nombre: "ADMINISTRATIVO" } } },
    ];
    const snapshot = structuredClone(rows);
    assert.deepEqual(enabledCatalogRows("audit", rows).map(row => row.id_bitacora), [3, 4]);
    assert.deepEqual(enabledCatalogRows("audit", rows, { administrativeRole: true }), rows);
    assert.deepEqual(rows, snapshot);
  });
  it("no presenta el total físico del API como total visible ni estima cuentas no cargadas", () => {
    const rows = [{ rol: { nombre: "ADMIN" } }, { rol: { nombre: "ADMINISTRATIVO" } }];
    for (const key of ["users", "update-user", "roles", "operators", "audit"]) {
      assert.equal(catalogPageMessage(key, rows, 150), "Se muestran 1 registros visibles de la página cargada.");
      assert.equal(catalogPageMessage(key, rows, 150, { administrativeRole: true }), "Se muestran los primeros 2 registros de 150.");
    }
    assert.equal(catalogPageMessage("users", rows, 2), "");
    assert.equal(catalogPageMessage("users", [], 100), "Se muestran 0 registros visibles de la página cargada.");
    assert.equal(catalogPageMessage("stations", [{ nombre: "Central" }], 150), "Se muestran los primeros 1 registros de 150.");
    assert.deepEqual(enabledCatalogRows("stations", [{ nombre: "Administrativo" }]), [{ nombre: "Administrativo" }]);
  });
  it("oculta Sidebar y accesos directos administrativos y permite restaurar su navegación", () => {
    assert.deepEqual(getPanelsByRole("ADMINISTRATIVO"), []);
    const restored = getPanelsByRole("ADMINISTRATIVO", { administrativeRole: true });
    assert.deepEqual(restored.map(panel => panel.id), ["home", "transport", "personnel", "fleet", "reports"]);
    assert.ok(restored.every(panel => panel.path.startsWith("/administrativo/")));
    assert.equal(restored[0].path, getHomeRouteByRole("ADMINISTRATIVO"));
  });
  it("el flag no cambia la navegación de Admin y Operador", () => {
    for (const role of ["ADMIN", "OPERADOR_ESTACION"]) {
      assert.deepEqual(getPanelsByRole(role), getPanelsByRole(role, { administrativeRole: true }));
    }
    assert.deepEqual(getPanelsByRole("ADMIN").map(panel => panel.id), ["home", "transport", "fleet", "users", "personnel", "security-access", "operations", "reports", "audit"]);
    assert.deepEqual(getPanelsByRole("OPERADOR_ESTACION").map(panel => panel.id), ["home", "operations", "access-counts"]);
  });
  it("conserva el rol interno y sus rutas exclusivas para una futura reactivación", () => {
    assert.equal(roleLabel("ADMINISTRATIVO"), "Administrativo");
    const auth = readFileSync(new URL("../src/types/auth.ts", import.meta.url), "utf8");
    const routes = readFileSync(new URL("../src/routes/AppRoutes.tsx", import.meta.url), "utf8");
    assert.match(auth, /UserRole = .*"ADMINISTRATIVO"/);
    assert.match(routes, /path="\/administrativo"/);
    for (const page of ["Dashboard", "Transport", "Personnel", "Fleet", "Reports"]) {
      assert.match(routes, new RegExp(`Administrative${page}Page`));
    }
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, SearchableSelect, Select, pagination } from "./support/ui-components.mjs";
import { filterSelectOptions, nextSelectIndex, initialSelectState, searchableSelectReducer, SELECT_MAX_HEIGHT } from "../src/utils/searchable-select.ts";

const { DEFAULT_PAGE_SIZE, filterAndSortRows, getTablePage, initialTableState, tableStateReducer } = pagination;
const rows = Array.from({ length: 50 }, (_, index) => ({ id: index + 1, name: index === 35 ? "Carlos" : `Guardia ${index + 1}` }));
const columns = [{ key: "name", label: "Guardia" }];
const render = (component, props) => renderToStaticMarkup(h(component, props));

describe("Paginación compartida de tablas", () => {
  it("oculta el paginador con 0, 1 o 5 registros", () => {
    assert.equal(DEFAULT_PAGE_SIZE, 5);
    for (const count of [0, 1, 5]) {
      const markup = render(DataTable, { rows: rows.slice(0, count), columns });
      assert.doesNotMatch(markup, /Paginación de tabla/);
      assert.equal(getTablePage(rows.slice(0, count), 1).showPagination, false);
    }
  });
  it("con 6 o 10 registros muestra dos páginas y con 11 muestra tres, con 5 filas por página", () => {
    for (const [count, pages] of [[6, 2], [10, 2], [11, 3]]) {
      const markup = render(DataTable, { rows: rows.slice(0, count), columns });
      assert.match(markup, new RegExp(`Página 1 de ${pages}`));
      assert.equal((markup.match(/<td>/g) ?? []).length, 5);
      assert.match(markup, /disabled="">Anterior/);
      assert.equal(getTablePage(rows.slice(0, count), 1).pages, pages);
    }
    assert.deepEqual(getTablePage(rows.slice(0, 6), 2).rows.map(row => row.id), [6]);
    assert.deepEqual(getTablePage(rows.slice(0, 10), 2).rows.map(row => row.id), [6, 7, 8, 9, 10]);
    assert.deepEqual(getTablePage(rows.slice(0, 11), 3).rows.map(row => row.id), [11]);
  });
  it("busca en todos los registros cargados antes de paginar y ordena los resultados completos", () => {
    const snapshot = structuredClone(rows);
    assert.deepEqual(getTablePage(filterAndSortRows(rows, ["name"], "carlos", null), 1).rows.map(row => row.id), [36]);
    const sorted = filterAndSortRows(rows, ["name"], "", { key: "id", desc: true });
    assert.deepEqual(getTablePage(sorted, 1).rows.map(row => row.id), [50, 49, 48, 47, 46]);
    assert.deepEqual(rows, snapshot);
  });
  it("cambiar búsqueda, orden o contexto de datos/filtros/tab vuelve a página 1", () => {
    const state = { ...initialTableState, page: 4 };
    assert.equal(tableStateReducer(state, { type: "query", query: "Carlos" }).page, 1);
    assert.equal(tableStateReducer(state, { type: "sort", sort: { key: "name", desc: false } }).page, 1);
    assert.equal(tableStateReducer(state, { type: "reset" }).page, 1);
    assert.equal(getTablePage(rows.slice(0, 2), 4).currentPage, 1);
  });
  it("siguiente/anterior recorren páginas sin perder ni repetir registros", () => {
    const first = getTablePage(rows, 1);
    const nextState = tableStateReducer(initialTableState, { type: "page", page: first.currentPage + 1 });
    const second = getTablePage(rows, nextState.page);
    assert.deepEqual(second.rows.map(row => row.id), [6, 7, 8, 9, 10]);
    assert.deepEqual(getTablePage(rows, tableStateReducer(nextState, { type: "page", page: second.currentPage - 1 }).page).rows, first.rows);
    assert.equal(getTablePage(rows, 99).currentPage, 10);
    assert.equal(getTablePage(rows, -1).currentPage, 1);
  });
  it("mantiene el tamaño explícito de Bitácora y los detalles/acciones de las filas", () => {
    const markup = render(DataTable, { rows: rows.slice(0, 11), columns, pageSize: 5,
      actions: row => h("button", { type: "button" }, `Editar ${row.id}`),
      renderExpandedRow: row => row.id === 1 ? h("p", null, "Detalle conservado") : null });
    assert.match(markup, /Página 1 de 3/);
    assert.match(markup, /Detalle conservado/);
    assert.match(markup, /Editar 5/);
    assert.doesNotMatch(markup, /Editar 6/);
  });
});

describe("Selector buscable de relaciones", () => {
  const options = [{ value: "001", label: "Estación Central" }, { value: "802", label: "Zona 6 Norte" },
    { value: "803", label: "Zona 6 Centro", disabled: true }];
  it("filtra por etiqueta, tolera acentos/mayúsculas y devuelve cero resultados", () => {
    assert.deepEqual(filterSelectOptions(options, " ESTACION ").map(option => option.value), ["001"]);
    assert.deepEqual(filterSelectOptions(options, "ZONA 6").map(option => option.value), ["802", "803"]);
    assert.deepEqual(filterSelectOptions(options, "sin coincidencias"), []);
  });
  it("admite cientos de opciones con altura limitada y scroll vertical", () => {
    const many = Array.from({ length: 500 }, (_, index) => ({ value: String(index), label: `Bus ${index}` }));
    assert.equal(filterSelectOptions(many, "").length, 500);
    assert.equal(filterSelectOptions(many, "Bus 499")[0].value, "499");
    assert.equal(SELECT_MAX_HEIGHT, 280);
    const css = readFileSync(new URL("../src/styles/components/searchable-select.css", import.meta.url), "utf8");
    assert.match(css, /max-height:\s*280px/);
    assert.match(css, /overflow-y:\s*auto/);
  });
  it("preserva el ID exacto al filtrar/seleccionar y muestra la etiqueta seleccionada", () => {
    const selected = filterSelectOptions(options, "central")[0];
    assert.strictEqual(selected, options[0]);
    const markup = render(SearchableSelect, { value: selected.value, options, onChange() {}, name: "stationId", "aria-label": "Estación" });
    assert.match(markup, /value="Estación Central"/);
    assert.match(markup, /type="hidden" name="stationId" value="001"/);
    assert.match(markup, /role="combobox"/);
    assert.match(markup, /aria-expanded="false"/);
    assert.match(markup, /aria-label="Estación"/);
  });
  it("navega con flechas, salta deshabilitados y cierra/restablece después de seleccionar o Escape", () => {
    let state = searchableSelectReducer(initialSelectState, { type: "open", active: nextSelectIndex(options, -1, 1) });
    assert.equal(state.active, 0);
    state = searchableSelectReducer(state, { type: "move", active: nextSelectIndex(options, state.active, 1) });
    assert.equal(state.active, 1);
    assert.equal(nextSelectIndex(options, state.active, 1), 0);
    assert.equal(nextSelectIndex(options, -1, -1), 1);
    assert.equal(nextSelectIndex(options.map(option => ({ ...option, disabled: true })), 0, 1), -1);
    state = searchableSelectReducer(state, { type: "search", query: "central", active: 0 });
    assert.equal(state.open, true);
    assert.equal(state.query, "central");
    assert.deepEqual(searchableSelectReducer(state, { type: "close" }), initialSelectState);
    assert.equal(nextSelectIndex([], -1, 1), -1);
  });
  it("conserva placeholder configurable y disabled sin abrir el combobox", () => {
    const markup = render(SearchableSelect, { value: "", options, onChange() {}, disabled: true, required: true,
      placeholder: "Selecciona un bus" });
    assert.match(markup, /placeholder="Selecciona un bus"/);
    assert.match(markup, /required="" disabled=""/);
    assert.match(markup, /aria-expanded="false"/);
    assert.doesNotMatch(markup, /role="listbox"/);
  });
  it("los selects fijos de estado y rol mantienen las opciones y el valor nativo", () => {
    const markup = render(Select, { value: "true", onChange() {}, children: [
      h("option", { key: "true", value: "true" }, "Activo"), h("option", { key: "false", value: "false" }, "Inactivo") ] });
    assert.match(markup, /<select>/);
    assert.match(markup, /value="true" selected="">Activo/);
    assert.match(markup, /value="false">Inactivo/);
    const roles = render(Select, { value: "ADMIN", onChange() {}, children: [
      h("option", { key: "ADMIN", value: "ADMIN" }, "Administrador"), h("option", { key: "OPERATOR", value: "OPERATOR" }, "Operador") ] });
    assert.match(roles, /value="ADMIN" selected="">Administrador/);
    assert.match(roles, /value="OPERATOR">Operador/);
  });
});

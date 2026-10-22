import { textValue } from "./table-format";
import type { Row } from "../types/table.types";
export const DEFAULT_PAGE_SIZE = 5;
export type TableSort = { key: string; desc: boolean } | null;
export type TableState = { query: string; page: number; sort: TableSort };
export const initialTableState: TableState = { query: "", page: 1, sort: null };

export function tableStateReducer(state: TableState, action:
  | { type: "query"; query: string } | { type: "sort"; sort: TableSort }
  | { type: "page"; page: number } | { type: "reset" }): TableState {
  if (action.type === "query") return { ...state, query: action.query, page: 1 };
  if (action.type === "sort") return { ...state, sort: action.sort, page: 1 };
  if (action.type === "page") return { ...state, page: Math.max(1, action.page) };
  return state.page === 1 ? state : { ...state, page: 1 };
}

export function filterAndSortRows(rows: Row[], keys: string[], query: string, sort: TableSort): Row[] {
  const search = query.toLocaleLowerCase("es");
  const matched = rows.filter(row => keys.map(key => textValue(row[key])).join(" ").toLocaleLowerCase("es").includes(search));
  return sort ? matched.sort((a, b) => textValue(a[sort.key]).localeCompare(textValue(b[sort.key]), "es", { numeric: true }) * (sort.desc ? -1 : 1)) : matched;
}

export function getTablePage<T>(rows: T[], page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const size = Number.isFinite(pageSize) && pageSize > 0 ? Math.max(1, Math.floor(pageSize)) : DEFAULT_PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const currentPage = Math.max(1, Math.min(page, pages));
  return { rows: rows.slice((currentPage - 1) * size, currentPage * size), pages, currentPage, showPagination: rows.length > size };
}

import { Fragment, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { Row, Column } from "../../types/table.types";
import { textValue } from "../../utils/table-format";
import { DEFAULT_PAGE_SIZE, filterAndSortRows, getTablePage, initialTableState, tableStateReducer } from "../../utils/table-pagination";

export type { Row, Column } from "../../types/table.types";
export { textValue } from "../../utils/table-format";

export function Badge({ value }: { value: unknown }) {
  const good = value === true || value === "FINALIZADO";
  return <span className={`badge ${good ? "badge-good" : value === "EN_CURSO" ? "badge-blue" : "badge-muted"}`}>
    {textValue(value).replaceAll("_", " ")}
  </span>;
}

interface DataTableProps {
  rows: Row[];
  columns: Column[];
  actions?: (row: Row) => ReactNode;
  loading?: boolean;
  showSearch?: boolean;
  renderExpandedRow?: (row: Row) => ReactNode;
  pageSize?: number;
  /** Resets pagination when a view changes while reusing the same loaded rows. */
  resetKey?: string | number;
}

export function DataTable({ rows, columns, actions, loading = false, pageSize = DEFAULT_PAGE_SIZE,
  renderExpandedRow, showSearch = true, resetKey }: DataTableProps) {
  const [{ query, page, sort }, dispatch] = useReducer(tableStateReducer, initialTableState);
  const filtered = useMemo(() => filterAndSortRows(rows, columns.map(col => col.key), showSearch ? query : "", sort),
    [rows, columns, query, showSearch, sort]);

  useEffect(() => { dispatch({ type: "reset" }); }, [rows, pageSize, resetKey, showSearch]);

  const { rows: paginatedRows, pages, currentPage, showPagination } = getTablePage(filtered, page, pageSize);
  return <div className="data-table">
    <div className="table-tools">
      {showSearch && <label className="search-field">
        <span aria-hidden="true">⌕</span>
        <input aria-label="Buscar en los registros cargados" placeholder="Buscar en esta tabla…" value={query}
          onChange={event => dispatch({ type: "query", query: event.target.value })} />
      </label>}
      <span className="muted">{filtered.length} registros cargados</span>
    </div>
    <div className="table-scroll" aria-busy={loading}>
      <table>
        <thead><tr>
          {columns.map(col => <th key={col.key} aria-sort={sort?.key === col.key ? sort.desc ? "descending" : "ascending" : "none"}>
            <button type="button" onClick={() => dispatch({ type: "sort", sort: { key: col.key, desc: sort?.key === col.key && !sort.desc } })}>
              {col.label}{" "}{sort?.key === col.key ? sort.desc ? "↓" : "↑" : "↕"}
            </button>
          </th>)}
          {actions && <th>Acciones</th>}
        </tr></thead>
        <tbody>
          {paginatedRows.map((row, index) => {
            const key = String(row.id ?? Object.entries(row).find(([name]) => name.startsWith("id_"))?.[1] ?? index);
            const expanded = renderExpandedRow?.(row);
            return <Fragment key={key}>
              <tr>
                {columns.map(col => <td key={col.key}>{col.render ? col.render(row) : textValue(row[col.key])}</td>)}
                {actions && <td><div className="row-actions">{actions(row)}</div></td>}
              </tr>
              {expanded != null && <tr className="data-table-expanded-row">
                <td colSpan={columns.length + (actions ? 1 : 0)}>{expanded}</td>
              </tr>}
            </Fragment>;
          })}
        </tbody>
      </table>
      {!filtered.length && <div className="empty-state">
        <strong>{loading ? "Cargando registros…" : "No hay resultados"}</strong>
        <p>{query ? "Prueba con otro nombre o código." : "Los registros aparecerán aquí después de crearlos."}</p>
      </div>}
    </div>
    {showPagination && <div className="table-pagination" role="navigation" aria-label="Paginación de tabla">
      <span aria-live="polite">Página {currentPage} de {pages}</span>
      <div>
        <button type="button" className="button quiet" disabled={currentPage <= 1}
          onClick={() => dispatch({ type: "page", page: currentPage - 1 })}>Anterior</button>
        <button type="button" className="button quiet" disabled={currentPage >= pages}
          onClick={() => dispatch({ type: "page", page: currentPage + 1 })}>Siguiente</button>
      </div>
    </div>}
  </div>;
}

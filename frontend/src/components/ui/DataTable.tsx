import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  Row,
  Column,
} from "../../types/table.types";

export type {
  Row,
  Column,
} from "../../types/table.types";

import {
  textValue,
} from "../../utils/table-format";

export {
  textValue,
} from "../../utils/table-format";


export function Badge({
  value,
}: {
  value: unknown;
}) {
  const good =
    value === true ||
    value === "FINALIZADO";

  return (
    <span
      className={`badge ${
        good
          ? "badge-good"
          : value === "EN_CURSO"
            ? "badge-blue"
            : "badge-muted"
      }`}
    >
      {textValue(value).replaceAll("_", " ")}
    </span>
  );
}


interface DataTableProps {
  rows: Row[];
  columns: Column[];

  actions?: (
    row: Row,
  ) => ReactNode;

  loading?: boolean;

  pageSize?: number;
}


export function DataTable({
  rows,
  columns,
  actions,
  loading = false,
  pageSize = 10,
}: DataTableProps) {
  const [
    query,
    setQuery,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    sort,
    setSort,
  ] = useState<{
    key: string;
    desc: boolean;
  } | null>(null);


  const filtered =
    useMemo(() => {
      const matched =
        rows.filter(
          (row) =>
            columns
              .map((col) =>
                textValue(
                  row[col.key],
                ),
              )
              .join(" ")
              .toLocaleLowerCase(
                "es",
              )
              .includes(
                query.toLocaleLowerCase(
                  "es",
                ),
              ),
        );


      if (!sort) {
        return matched;
      }


      return matched.sort(
        (a, b) =>
          textValue(
            a[sort.key],
          ).localeCompare(
            textValue(
              b[sort.key],
            ),
            "es",
            {
              numeric: true,
            },
          ) *
          (sort.desc
            ? -1
            : 1),
      );
    }, [
      rows,
      columns,
      query,
      sort,
    ]);


  /*
   * Si cambia la búsqueda,
   * los datos o el tamaño de página,
   * regresamos a la primera página.
   */
  useEffect(() => {
    setPage(1);
  }, [
    query,
    rows,
    pageSize,
  ]);


  const pages =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
          pageSize,
      ),
    );


  const currentPage =
    Math.min(
      page,
      pages,
    );


  const start =
    (currentPage - 1) *
    pageSize;


  const paginatedRows =
    filtered.slice(
      start,
      start + pageSize,
    );


  return (
    <div className="data-table">

      <div className="table-tools">

        <label className="search-field">

          <span aria-hidden="true">
            ⌕
          </span>

          <input
            aria-label="Buscar en los registros cargados"
            placeholder="Buscar en esta tabla…"
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
          />

        </label>


        <span className="muted">
          {filtered.length} registros cargados
        </span>

      </div>


      <div
        className="table-scroll"
        aria-busy={loading}
      >

        <table>

          <thead>
            <tr>

              {columns.map(
                (col) => (
                  <th key={col.key}>

                    <button
                      type="button"
                      onClick={() =>
                        setSort({
                          key:
                            col.key,
                          desc:
                            sort?.key ===
                              col.key &&
                            !sort.desc,
                        })
                      }
                    >
                      {col.label}{" "}

                      {sort?.key ===
                      col.key
                        ? sort.desc
                          ? "↓"
                          : "↑"
                        : "↕"}
                    </button>

                  </th>
                ),
              )}


              {actions && (
                <th>
                  Acciones
                </th>
              )}

            </tr>
          </thead>


          <tbody>

            {paginatedRows.map(
              (row, index) => (
                <tr
                  key={String(
                    row.id ??
                      Object.entries(
                        row,
                      ).find(
                        ([key]) =>
                          key.startsWith(
                            "id_",
                          ),
                      )?.[1] ??
                      index,
                  )}
                >

                  {columns.map(
                    (col) => (
                      <td key={col.key}>
                        {col.render
                          ? col.render(
                              row,
                            )
                          : textValue(
                              row[
                                col.key
                              ],
                            )}
                      </td>
                    ),
                  )}


                  {actions && (
                    <td>
                      <div className="row-actions">
                        {actions(
                          row,
                        )}
                      </div>
                    </td>
                  )}

                </tr>
              ),
            )}

          </tbody>

        </table>


        {!filtered.length && (
          <div className="empty-state">

            <strong>
              {loading
                ? "Cargando registros…"
                : "No hay resultados"}
            </strong>

            <p>
              {query
                ? "Prueba con otro nombre o código."
                : "Los registros aparecerán aquí después de crearlos."}
            </p>

          </div>
        )}

      </div>


      <div className="table-pagination">

        <span>
          Página {currentPage} de {pages}
        </span>


        <div>

          <button
            className="button quiet"
            disabled={
              currentPage <= 1
            }
            onClick={() =>
              setPage(
                currentPage - 1,
              )
            }
          >
            Anterior
          </button>


          <button
            className="button quiet"
            disabled={
              currentPage >= pages
            }
            onClick={() =>
              setPage(
                currentPage + 1,
              )
            }
          >
            Siguiente
          </button>

        </div>

      </div>

    </div>
  );
}